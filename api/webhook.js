import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const body = req.body

  try {
    const emailRaw =
      body?.data?.buyer?.email ||
      body?.buyer?.email ||
      body?.student?.email ||
      body?.customer?.email ||
      body?.email

    const status =
      body?.data?.status ||
      body?.status

    console.log("STATUS FINAL:", status)

    const transaction_id = String(
      body?.data?.transaction?.id ||
      body?.transaction?.id ||
      body?.transaction_id ||
      body?.id ||
      ""
    )

    if (!emailRaw) {
      return res.status(400).json({ error: "Email não encontrado" })
    }

    if (!["paid", "approved", "payment_approved", "completed"].includes(status)) {
      return res.status(200).json({ ok: true, ignored: true })
    }

    const email = emailRaw.trim().toLowerCase()

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const { error } = await supabaseAdmin
      .from("access")
      .upsert(
        {
          email,
          product_id: "andromeda",
          status: "active",
          transaction_id,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      )

    if (error) {
      console.error("Supabase error:", error.message)
      return res.status(500).json({ error: "Erro ao salvar no banco" })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error("Webhook error:", err.message)
    return res.status(500).json({ error: "Erro interno" })
  }
}