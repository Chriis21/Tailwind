import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
})

const env = envSchema.safeParse(process.env)

if (!env.success) {
  throw new Error('Supabase-Umgebungsvariablen fehlen. Bitte .env.local prüfen.')
}

export const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = env.data
