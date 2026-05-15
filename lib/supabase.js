import { createClient } from '@supabase/supabase-js'

// 1. Definição das variáveis baseada no seu print da Vercel
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY // Esta é a sua chave pública/anon
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

// 2. Verificação de segurança para evitar o Erro 500
if (!supabaseUrl || !supabaseKey || !supabaseServiceRole) {
  console.error("❌ ERRO: Uma ou mais variáveis do Supabase não foram carregadas. Verifique o painel da Vercel.")
}

// 3. Cliente para o GPT (Leitura - usando a chave pública)
export const supabase = createClient(
  supabaseUrl || '', 
  supabaseKey || ''
)

// 4. Cliente para o Webhook (Escrita - usando a Service Role)
export const supabaseAdmin = createClient(
  supabaseUrl || '',
  supabaseServiceRole || ''
)