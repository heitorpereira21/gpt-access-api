import { supabase } from '../lib/supabase'

export default async function handler(req, res) {
  // 1. Bloqueia métodos que não sejam POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = req.body

  try {
    // 2. Extração robusta de dados (tentando vários formatos comuns de plataformas)
    const emailRaw = body?.customer?.email || body?.email || body?.data?.buyer?.email
    const event = body?.event || body?.type || body?.status
    const transaction_id = String(
      body?.transaction?.id ||
      body?.transaction_id ||
      body?.id ||
      body?.reference ||
      ''
    )

    if (!emailRaw) {
      return res.status(400).json({ error: 'Email não encontrado no webhook' })
    }

    const email = emailRaw.trim().toLowerCase()

    // 3. Lógica de Status
    // Mapeia diferentes nomes de eventos para o seu padrão 'active' ou 'inactive'
    let status = 'inactive'
    if (['approved', 'payment_approved', 'completed', 'active', 'paid'].includes(event)) {
      status = 'active'
    }

    // 4. Cálculo de Expiração (Padrão 30 dias)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // 5. Upsert no Supabase
    // Nota: Certifique-se que sua tabela 'access' tem 'email' como UNIQUE
    const { error } = await supabase.from('access').upsert({
      email,
      product_id: 'andromeda', // Produto padrão
      status,
      transaction_id,
      expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'email' })

    if (error) {
      console.error('Erro ao processar banco no webhook genérico:', error.message)
      return res.status(500).json({ error: 'Erro ao salvar no banco' })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Erro crítico no webhook genérico:', err.message)
    return res.status(500).json({ error: 'Erro interno no servidor' })
  }
}