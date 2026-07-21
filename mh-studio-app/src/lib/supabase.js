import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Se as variáveis não estiverem configuradas, o app roda em "modo demo"
// (não salva nada, apenas simula). Assim o site nunca quebra.
export const supabase = url && anonKey ? createClient(url, anonKey) : null
