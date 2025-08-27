import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cachedClient: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase-Umgebungsvariablen fehlen. Bitte .env.local prüfen.')
  }

  cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  })
  return cachedClient
}

export default getSupabaseClient

