import { supabaseAdmin } from '../lib/supabase'
import crypto from 'crypto'

export const config = {
  api: {
    bodyParser: true,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const payload = req.body

    console.log("🔥 RAW BODY:", JSON.stringify(payload, null, 2))

    // 🔥 Eduzz sempre manda dados dentro de "data"
    const transaction = payload?.data || payload

    console.log("📦 TRANSACTION:", transaction)
    console.log("📊 STATUS:", transaction?.status)

    const status = transaction?.status

    // 🔥 validação correta
    const validStatuses = ['paid', 'approved', 'payment_approved', 'completed']

    if (!validStatuses.includes(status)) {
      console.log(`⛔ Webhook ignorado. Status recebido: ${status}`)
      return res.status(200).json({
        ok: true,
        ignored: true,
        received_status: status
      })
    }

    // 🔥 email (bem robusto)
    const rawEmail =
      transaction?.buyer?.email ||
      transaction?.student?.email ||
      transaction?.customer?.email ||
      transaction?.email

    if (!rawEmail) {
      console.log("❌ Email não encontrado:", transaction)
      return res.status(400).json({ error: "Email não encontrado" })
    }

    const email = rawEmail.trim().toLowerCase()

    // 🔥 transaction id seguro
    const transaction_id = String(
      transaction?.transaction?.id ||
      transaction?.id ||
      transaction?.transaction_id ||
      ""
    )

    // 🔥 produto
    const product_id =
      transaction?.items?.[0]?.productId ||
      "andromeda"

    // 🔥 registro final
    const record = {
      email,
      product_id,
      transaction_id,
      status: "active",
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }

    console.log("💾 SALVANDO NO SUPABASE:", record)

    // 🔥 SUPABASE (corrigido e obrigatório)
    const { data, error } = await supabaseAdmin
      .from("access")
      .upsert(record, { onConflict: "email" })

    if (error) {
      console.log("❌ ERRO SUPABASE:", error.message)
      return res.status(500).json({
        error: "Erro ao salvar no banco",
        details: error.message
      })
    }

    return res.status(200).json({
      ok: true,
      message: "Acesso liberado com sucesso",
      email
    })

  } catch (error) {
    console.log("🔥 ERRO GERAL:", error)
    return res.status(500).json({
      error: "Internal server error"
    })
  }
}