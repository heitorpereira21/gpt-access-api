import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

export default async function handler(req, res) {
  try {
    const { email } = req.body || {}

    if (!email) {
      return res.json({
        active: false,
        reason: 'no_email',
        message: 'Email não informado'
      })
    }

    const cleanEmail = email.trim().toLowerCase()

    const { data, error } = await supabase
      .from('access')
      .select('*')
      .ilike('email', cleanEmail)
      .maybeSingle()

    // ❌ Não encontrou
    if (!data || error) {
      return res.json({
        active: false,
        reason: 'not_found',
        message: 'Acesso não encontrado'
      })
    }

    // ❌ Encontrou mas está inativo
    if (data.status !== 'active') {
      return res.json({
        active: false,
        reason: data.status,
        message: 'Acesso inativo'
      })
    }

    // Acesso liberado
    return res.json({
      active: true,
      reason: 'active',
      message: 'Acesso liberado'
    })

  } catch (err) {
    return res.status(500).json({
      active: false,
      reason: 'server_error',
      message: err.message
    })
  }
}