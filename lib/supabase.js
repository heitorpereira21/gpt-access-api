import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
// Tenta pegar SUPABASE_ANON_KEY, se não existir, tenta SUPABASE_KEY (que aparece no seu print)
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

// Verificação de segurança para evitar o Erro 500 por variáveis vazias
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ ERRO CRÍTICO: Variáveis do Supabase (URL ou ANON) não configuradas.")
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
)

export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceRole || 'placeholder'
)