import { createClient } from '@supabase/supabase-js'

// Usar a chave anon ou service role, dependendo da sua config de RLS
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

export default async function handler(req, res) {
  try {
    // 1. Suporte para GET e POST (útil para testes rápidos no navegador)
    const email = req.method === 'POST' ? req.body?.email : req.query?.email

    if (!email) {
      return res.status(400).json({
        active: false,
        reason: 'no_email',
        message: 'Email não informado'
      })
    }

    const cleanEmail = email.trim().toLowerCase()
    const now = new Date().toISOString()

    // 2. Consulta Inteligente:
    // Buscamos o registro que combine o email E ainda seja válido
    const { data, error } = await supabase
      .from('access')
      .select('status, expires_at')
      .ilike('email', cleanEmail)
      .single() // Usamos single para pegar o registro único desse user

    // ❌ Erro na busca ou não existe
    if (error || !data) {
      return res.json({
        active: false,
        reason: 'not_found',
        message: 'Acesso não encontrado ou usuário inexistente'
      })
    }

    // ❌ Verificação de Status Manual
    if (data.status !== 'active') {
      return res.json({
        active: false,
        reason: 'revoked',
        message: 'Acesso suspenso ou cancelado'
      })
    }

    // ❌ Verificação de Expiração (O que faltava!)
    // Se a data atual for MAIOR que a data de expiração, o acesso acabou.
    if (data.expires_at && new Date(now) > new Date(data.expires_at)) {
      return res.json({
        active: false,
        reason: 'expired',
        message: 'Assinatura expirada. Por favor, renove seu acesso.',
        expired_at: data.expires_at
      })
    }

    // ✅ Acesso liberado
    return res.json({
      active: true,
      reason: 'active',
      message: 'Acesso liberado',
      expires_at: data.expires_at
    })

  } catch (err) {
    return res.status(500).json({
      active: false,
      reason: 'server_error',
      message: 'Erro interno no servidor de checagem'
    })
  }
}