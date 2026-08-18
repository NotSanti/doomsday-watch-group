import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getClientEnv } from '@/lib/env'
import type { Database } from '@/types/database'

export type BrowserSupabaseClient = SupabaseClient<Database>

let client: BrowserSupabaseClient | undefined

export function getSupabaseClient(): BrowserSupabaseClient {
  if (!client) {
    const env = getClientEnv()
    client = createClient<Database>(
      env.VITE_SUPABASE_URL,
      env.VITE_SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      },
    )
  }

  return client
}

export function resetSupabaseClient(): void {
  client = undefined
}
