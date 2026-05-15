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
    const secret = process.env.EDUZZ_SECRET
    const signature = req.headers['x-eduzz-signature']

    // 🔐 validação opcional (não pode quebrar webhook)
    if (secret && signature) {
      try {
        const rawBody = JSON.stringify(req.body)
        const hmac = crypto.createHmac('sha256', secret)
        const hash = hmac.update(rawBody).digest('hex')
        const expectedSignature = signature.replace('sha256=', '')

        if (hash !== expectedSignature) {
          console.log('Webhook: assinatura inválida detectada')
        }
      } catch (err) {
        console.log('Erro assinatura:', err.message)
      }
    }

    const payload = req.body

    console.log("RAW BODY:", JSON.stringify(payload, null, 2))

    // 🔥 Eduzz sempre pode vir em data ou direto
    const data = payload?.data || payload

    console.log("DATA:", data)
    console.log("STATUS:", data?.status)

    const status = data?.status

    // 🔥 proteção anti-500 (NUNCA deixar quebrar)
    const validStatuses = ['paid', 'approved', 'payment_approved', 'completed']

    if (!status || !validStatuses.includes(status)) {
      console.log(`Webhook ignorado. Status recebido: ${status}`)
      return res.status(200).json({
        ok: true,
        ignored: true,
        received_status: status || null
      })
    }

    // 🔥 email seguro
    const rawEmail =
      data?.buyer?.email ||
      data?.student?.email ||
      data?.customer?.email ||
      data?.email

    if (!rawEmail) {
      console.log('Sem email no payload')
      return res.status(200).json({ ok: true, ignored: true, reason: 'no email' })
    }

    const email = rawEmail.trim().toLowerCase()

    // 🔥 transaction id seguro
    const transaction_id = String(
      data?.transaction?.id ||
      data?.id ||
      data?.transaction_id ||
      ''
    )

    // 🔥 produto seguro
    const product_id =
      data?.items?.[0]?.productId ||
      data?.product_id ||
      'andromeda'

    const record = {
      email,
      product_id,
      transaction_id,
      status: 'active',
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }

    console.log('SALVANDO:', record)

    const { error } = await supabaseAdmin
      .from('access')
      .upsert(record, { onConflict: 'email' })

    if (error) {
      console.log('SUPABASE ERROR:', error.message)

      // 🔥 NÃO quebra webhook por erro de banco
      return res.status(200).json({
        ok: false,
        supabase_error: true
      })
    }

    return res.status(200).json({
      ok: true,
      message: 'Acesso liberado',
      email
    })

  } catch (error) {
    console.log('WEBHOOK ERROR:', error.message)

    // 🔥 NUNCA deixar virar 500 pra Eduzz
    return res.status(200).json({
      ok: false,
      error: 'handled'
    })
  }
}