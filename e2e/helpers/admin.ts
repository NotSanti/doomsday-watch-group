import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let adminClient: SupabaseClient | undefined

export function getAdminClient(): SupabaseClient {
  if (!adminClient) {
    const url =
      process.env.E2E_SUPABASE_URL?.trim() ||
      process.env.VITE_SUPABASE_URL?.trim()
    const serviceRoleKey = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY?.trim()

    if (!url || !serviceRoleKey) {
      throw new Error('Missing Supabase admin configuration for E2E helpers.')
    }

    adminClient = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  return adminClient
}
