import { supabaseAdmin } from '../lib/supabase'
import crypto from 'crypto'

export const config = {
  api: {
    // Importante: Algumas plataformas exigem o corpo bruto (raw body) para validar HMAC.
    // Se a validação falhar, você precisará desabilitar o bodyParser aqui.
    bodyParser: true,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const secret = process.env.EDUZZ_SECRET
  const signature = req.headers['x-eduzz-signature']
  
  // 1. Correção da Assinatura: Usar o corpo bruto ou string estável
  const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)

  if (!secret || !signature) {
    console.log('Webhook: Modo teste ou segredo ausente')
    return res.status(200).json({ ok: true })
  }

  try {
    const hmac = crypto.createHmac('sha256', secret)
    // CORREÇÃO: Eduzz geralmente usa 'hex'. Se for 'sha256=', removemos o prefixo para comparar.
    const hash = hmac.update(rawBody).digest('hex')
    const expectedSignature = signature.replace('sha256=', '')

    if (!crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(hash))) {
      console.log('Webhook: Assinatura inválida')
      return res.status(401).json({ error: 'Invalid signature' })
    }
  } catch (err) {
    console.error('Erro na validação:', err)
    return res.status(401).json({ error: 'Invalid signature' })
  }

  try {
    const payload = req.body
    const transaction = Array.isArray(payload) ? payload[0] : (payload.transaction || payload)

    // 2. Filtro de Status
    if (transaction.status !== 'approved' && transaction.status !== 3) { // 3 costuma ser 'pago' na Eduzz
      console.log(`Webhook: Status ignorado: ${transaction.status}`)
      return res.status(200).json({ ok: true })
    }

    // 3. Normalização dos dados (Importante para o Supabase)
    const rawEmail = transaction.buyer?.email || transaction.customer?.email || transaction.email_comprador
    if (!rawEmail) throw new Error('E-mail não encontrado')
    
    const email = rawEmail.trim().toLowerCase() // Evita duplicatas por maiúsculas
    const transactionId = String(transaction.id || transaction.transaction_id || transaction.transacao_id)

    // 4. Cálculo de Data
    const purchaseDate = new Date(transaction.created_at || transaction.date || new Date())
    const expiresAt = new Date(purchaseDate)
    expiresAt.setDate(purchaseDate.getDate() + 30)

    const record = {
      email,
      product_id: String(transaction.product_id || 'andromeda'),
      expires_at: expiresAt.toISOString(),
      transaction_id: transactionId,
      status: 'active',
      updated_at: new Date().toISOString()
    }

    console.log('Upserting no Supabase:', record)

    // 5. Upsert com a Service Role Key (supabaseAdmin)
    const { error } = await supabaseAdmin
      .from('access')
      .upsert(record, { onConflict: 'email' })

    if (error) {
      console.error('Erro Supabase:', error.message)
      return res.status(500).json({ error: 'Erro ao salvar no banco' })
    }

    return res.status(200).json({ ok: true, message: 'Acesso liberado' })
  } catch (error) {
    console.error('Webhook processing error:', error.message)
    return res.status(500).json({ error: 'Internal server error' })
  }
}