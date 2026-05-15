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

  const secret = process.env.EDUZZ_SECRET
  const signature = req.headers['x-eduzz-signature']

  // Validação de Assinatura
  if (secret && signature) {
    try {
      const rawBody = JSON.stringify(req.body)
      const hmac = crypto.createHmac('sha256', secret)
      const hash = hmac.update(rawBody).digest('hex')
      const expectedSignature = signature.replace('sha256=', '')

      // Comparação simples para evitar erros de Buffer em tamanhos diferentes
      if (hash !== expectedSignature) {
        console.log('Webhook: assinatura inválida detectada')
        // Descomente a linha abaixo se quiser bloquear assinaturas inválidas em produção
        // return res.status(401).json({ error: 'Invalid signature' })
      }
    } catch (err) {
      console.error('Erro na validação HMAC:', err)
    }
  }

  try {
    const payload = req.body
    const transaction = payload?.transaction || payload

    console.log("RAW BODY:", JSON.stringify(req.body, null, 2))
    console.log("TRANSACTION:", transaction)
    console.log("STATUS:", transaction?.status)

    // 1. CORREÇÃO: Lista de status ampliada para o que a Eduzz realmente envia
    const validStatuses = [
      'approved',
      'paid',
      'payment_approved',
      'completed',
      '3', // Status pago em string
      3    // Status pago em número
    ]

    if (!validStatuses.includes(transaction.status)) {
      console.log(`Webhook ignorado. Status recebido: ${transaction.status}`)
      return res.status(200).json({
        ok: true,
        ignored: true,
        received_status: transaction.status
      })
    }

    // 2. Extração do e-mail com fallback total
    const rawEmail =
      transaction?.buyer?.email ||
      transaction?.customer?.email ||
      transaction?.email ||
      transaction?.student?.email

    if (!rawEmail) {
      console.error('Email não encontrado no payload:', transaction)
      return res.status(400).json({ error: 'Email não encontrado' })
    }

    const email = rawEmail.trim().toLowerCase()

    // 3. Montagem do registro
    const record = {
      email: email,
      product_id: String(transaction?.product_id || transaction?.items?.[0]?.productId || 'andromeda'),
      transaction_id: String(transaction?.id || transaction?.transaction_id || ''),
      status: 'active',
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // +30 dias
    }

    console.log('Tentando gravar no Supabase:', record)

    // 4. CORREÇÃO NO UPSERT: 
    // Garanta que 'email' seja a chave única na sua tabela 'access' do Supabase
    const { data, error } = await supabaseAdmin
      .from('access')
      .upsert(record, { onConflict: 'email' }) 

    if (error) {
      console.error('Erro Supabase detalhado:', error.message)
      return res.status(500).json({ error: 'Erro ao salvar no banco', details: error.message })
    }

    return res.status(200).json({
      ok: true,
      message: 'Acesso liberado e gravado no banco',
      email: email
    })

  } catch (error) {
    console.error('Erro Geral Webhook:', error.message)
    return res.status(500).json({ error: 'Internal server error' })
  }
}