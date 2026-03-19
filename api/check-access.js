import { supabase } from '../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email } = req.body

  if (!email) {
    return res.status(400).json({ active: false, error: 'Email obrigatório' })
  }

  const { data, error } = await supabase
    .from('access')
    .select('*')
    .eq('email', email)
    .single()

  if (error || !data) {
    return res.json({ active: false })
  }

  if (data.status === 'active') {
    return res.json({ active: true })
  }

  return res.json({ active: false })
}