import { supabaseAdmin } from '../lib/supabase'
import crypto from 'crypto'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    console.log('Webhook: Method not allowed')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secret = process.env.EDUZZ_SECRET
  const signature = req.headers['x-eduzz-signature']
  const rawBody = JSON.stringify(req.body)

  // Se não houver assinatura, assumimos que é teste do Eduzz → retorna 200
  if (!secret || !signature) {
    console.log('Webhook: Missing secret or signature (test mode)')
    return res.status(200).json({ ok: true })
  }

  // Validação de assinatura HMAC
  try {
    const hmac = crypto.createHmac('sha256', secret)
    const digest = 'sha256=' + hmac.update(rawBody).digest('base64')
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
      console.log('Webhook: Invalid signature')
      return res.status(401).json({ error: 'Invalid signature' })
    }
  } catch (err) {
    console.error('Erro na validação da assinatura:', err)
    return res.status(401).json({ error: 'Invalid signature' })
  }

  console.log('Webhook: Signature validated, processing...')

  try {
    let payload = req.body

    if (Array.isArray(payload)) {
      payload = payload[0]
    }

    const transaction = payload.transaction || payload

    // Ignorar transações não aprovadas
    if (transaction.status !== 'approved') {
      console.log(`Webhook: Ignored non-approved status: ${transaction.status}`)
      return res.status(200).json({ ok: true })
    }

    const email = transaction.buyer?.email || transaction.customer?.email
    const transactionId = transaction.id || transaction.transaction_id

    if (!email || !transactionId) {
      console.log('Webhook: Missing email or transaction ID')
      return res.status(400).json({ error: 'Missing email or transaction ID' })
    }

    const purchaseDate = new Date(transaction.created_at || transaction.date)
    if (isNaN(purchaseDate)) {
      console.log('Webhook: Invalid purchase date')
      return res.status(400).json({ error: 'Invalid purchase date' })
    }
    const expiresAt = new Date(purchaseDate)
    expiresAt.setDate(purchaseDate.getDate() + 30)

    const record = {
      email,
      product_id: transaction.product_id || 'andromeda',
      expires_at: expiresAt.toISOString(),
      transaction_id: String(transactionId),
      status: 'active',
      updated_at: new Date().toISOString()
    }

    console.log('Supabase upsert payload:', record)

    const { error } = await supabaseAdmin
      .from('access')
      .upsert(record, { onConflict: 'email' })

    if (error) {
      console.error('Supabase error:', error)
      return res.status(500).json({ error: 'Supabase upsert failed' })
    }

    console.log(`Webhook: Access activated for ${email}, expires ${expiresAt.toISOString()}`)
    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}