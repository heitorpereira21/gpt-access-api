import { supabaseAdmin } from '../../lib/supabase'
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

  // Raw body para validação HMAC
  const rawBody =
    typeof req.body === 'string'
      ? req.body
      : JSON.stringify(req.body)

  // Se estiver em modo teste
  if (!secret || !signature) {
    console.log('Webhook: modo teste ou assinatura ausente')
  } else {
    try {
      const hmac = crypto.createHmac('sha256', secret)

      const hash = hmac
        .update(rawBody)
        .digest('hex')

      const expectedSignature = signature.replace('sha256=', '')

      const valid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(hash)
      )

      if (!valid) {
        console.log('Webhook: assinatura inválida')

        return res.status(401).json({
          error: 'Invalid signature'
        })
      }
    } catch (err) {
      console.error('Erro na validação:', err)

      return res.status(401).json({
        error: 'Invalid signature'
      })
    }
  }

  try {
    const payload = req.body

    // Compatibilidade com array ou objeto
    const transaction = Array.isArray(payload)
      ? payload[0]
      : payload

    // Status aceitos
    const validStatuses = [
      'approved',
      'paid',
      'payment_approved',
      'completed',
      3
    ]

    if (!validStatuses.includes(transaction.status)) {
      console.log(
        `Webhook ignorado. Status: ${transaction.status}`
      )

      return res.status(200).json({
        ok: true,
        ignored: true
      })
    }

    // Email
    const rawEmail =
      transaction?.buyer?.email ||
      transaction?.customer?.email ||
      transaction?.email ||
      transaction?.student?.email

    if (!rawEmail) {
      throw new Error('Email não encontrado')
    }

    const email = rawEmail
      .trim()
      .toLowerCase()

    // Transaction ID
    const transactionId = String(
      transaction?.transaction?.id ||
      transaction?.id ||
      transaction?.transaction_id ||
      transaction?.transacao_id ||
      ''
    )

    // Produto
    const productId = String(
      transaction?.items?.[0]?.productId ||
      transaction?.product_id ||
      'andromeda'
    )

    // Data da compra
    const purchaseDate = new Date(
      transaction?.paidAt ||
      transaction?.createdAt ||
      transaction?.created_at ||
      transaction?.date ||
      new Date()
    )

    // Expiração
    const expiresAt = new Date(purchaseDate)
    expiresAt.setDate(expiresAt.getDate() + 30)

    const record = {
      email,
      product_id: productId,
      transaction_id: transactionId,
      status: 'active',
      expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('Salvando acesso:', record)

    const { error } = await supabaseAdmin
      .from('access')
      .upsert(record, {
        onConflict: 'email'
      })

    if (error) {
      console.error('Erro Supabase:', error)

      return res.status(500).json({
        error: 'Erro ao salvar no banco'
      })
    }

    return res.status(200).json({
      ok: true,
      message: 'Acesso liberado'
    })

  } catch (error) {
    console.error(
      'Erro no webhook:',
      error.message
    )

    return res.status(500).json({
      error: 'Internal server error'
    })
  }
}