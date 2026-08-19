import path from 'node:path'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve('.env') })

const required = ['E2E_SUPABASE_SERVICE_ROLE_KEY'] as const

function hasLocalSupabaseConfig(): boolean {
  const url =
    process.env.E2E_SUPABASE_URL?.trim() ||
    process.env.VITE_SUPABASE_URL?.trim()
  const publishable =
    process.env.E2E_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

  return Boolean(url && publishable)
}

export default function globalSetup(): void {
  const missing = required.filter((name) => !process.env[name]?.trim())

  if (missing.length > 0) {
    throw new Error(
      `E2E setup is missing ${missing.join(', ')}. Copy .env.example, run \`npx supabase start\`, and fill values from \`npx supabase status\`.`,
    )
  }

  if (!hasLocalSupabaseConfig()) {
    throw new Error(
      'E2E setup needs E2E_SUPABASE_URL and E2E_SUPABASE_PUBLISHABLE_KEY (or local VITE_* equivalents).',
    )
  }
}
