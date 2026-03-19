import { supabase } from '../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = req.body

  try {
    const email = body?.customer?.email
    const event = body?.event || body?.type
    const transaction_id = body?.transaction_id || body?.id

    if (!email) {
      return res.status(400).json({ error: 'Email não encontrado no webhook' })
    }

    let status = 'inactive'

    if (event === 'approved' || event === 'payment_approved') {
      status = 'active'
    }

    if (
      event === 'refunded' ||
      event === 'canceled' ||
      event === 'chargeback'
    ) {
      status = 'inactive'
    }

    await supabase.from('access').upsert({
      email,
      product_id: 'andromeda',
      status,
      transaction_id,
      updated_at: new Date()
    })

    return res.status(200).json({ ok: true })
  } catch (err) {
    return res.status(500).json({ error: 'Erro no webhook' })
  }
}