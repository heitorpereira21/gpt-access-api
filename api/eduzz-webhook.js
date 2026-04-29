import { supabaseAdmin } from '../lib/supabase'
import crypto from 'crypto'

// 👇 MUITO IMPORTANTE
export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    console.log('Webhook: Method not allowed')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secret = process.env.EDUZZ_SECRET
  const signature = req.headers['x-eduzz-signature']

  // 👇 pega o raw body REAL
  let rawBody = ''
  for await (const chunk of req) {
    rawBody += chunk
  }

  let body
  try {
    body = JSON.parse(rawBody)
  } catch (err) {
    console.error('Erro ao parsear JSON:', err)
    return res.status(400).json({ error: 'Invalid JSON' })
  }

  // 👉 se não tiver assinatura, só loga (modo teste)
  if (!secret || !signature) {
    console.log('Webhook: Missing secret or signature (test mode)')
    console.log('BODY:', body)
    return res.status(200).json({ ok: true })
  }

  // 🔐 validação HMAC segura
  try {
    const hmac = crypto.createHmac('sha256', secret)
    const digest = 'sha256=' + hmac.update(rawBody).digest('base64')

    const sigBuffer = Buffer.from(signature)
    const digestBuffer = Buffer.from(digest)

    if (
      sigBuffer.length !== digestBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, digestBuffer)
    ) {
      console.log('Webhook: Invalid signature')
      return res.status(401).json({ error: 'Invalid signature' })
    }
  } catch (err) {
    console.error('Erro na validação da assinatura:', err)
    return res.status(401).json({ error: 'Invalid signature' })
  }

  console.log('Webhook: Signature validated')

  try {
    let payload = body

    if (Array.isArray(payload)) {
      payload = payload[0]
    }

    const transaction = payload.transaction || payload

    console.log('TRANSACTION:', transaction)

    // 👉 aceita mais variações de status
    const status = transaction.status?.toLowerCase()

    if (!['approved', 'paid', 'completed'].includes(status)) {
      console.log(`Webhook: Ignored status: ${status}`)
      return res.status(200).json({ ok: true })
    }

    const email =
      transaction.buyer?.email ||
      transaction.customer?.email ||
      transaction.email

    const transactionId =
      transaction.id ||
      transaction.transaction_id

    if (!email || !transactionId) {
      console.log('Missing email or transaction ID')
      return res.status(400).json({ error: 'Missing data' })
    }

    const purchaseDate = new Date(
      transaction.created_at || transaction.date || new Date()
    )

    const expiresAt = new Date(purchaseDate)
    expiresAt.setDate(purchaseDate.getDate() + 30)

    const record = {
      email,
      product_id: transaction.product_id || 'andromeda',
      expires_at: expiresAt.toISOString(),
      transaction_id: String(transactionId),
      status: 'active',
      updated_at: new Date().toISOString(),
    }

    console.log('UPSERT:', record)

    const { error } = await supabaseAdmin
      .from('access')
      .upsert(record, { onConflict: 'transaction_id' }) // 👈 corrigido

    if (error) {
      console.error('Supabase error:', error)
      return res.status(500).json({ error: 'DB error' })
    }

    console.log(`Access liberado pra ${email}`)
    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return res.status(500).json({ error: 'Internal error' })
  }
}