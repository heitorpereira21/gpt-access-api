import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
// Aceita tanto SUPABASE_KEY (seu print) quanto SUPABASE_ANON_KEY
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabase = createClient(supabaseUrl || '', supabaseKey || '')
export const supabaseAdmin = createClient(supabaseUrl || '', supabaseServiceRole || '')