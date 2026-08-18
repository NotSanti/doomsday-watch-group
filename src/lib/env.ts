import { z } from 'zod'

const clientEnvSchema = z.object({
  VITE_APP_URL: z.string().trim().url(),
  VITE_SUPABASE_URL: z.string().trim().url(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().trim().min(1),
})

export type ClientEnv = z.infer<typeof clientEnvSchema>

export const CLIENT_ENV_ERROR =
  'This app is missing its public configuration. Set VITE_APP_URL, VITE_SUPABASE_URL, and VITE_SUPABASE_PUBLISHABLE_KEY.'

export function parseClientEnv(
  source: Record<string, string | undefined>,
): ClientEnv {
  const parsed = clientEnvSchema.safeParse({
    VITE_APP_URL: source.VITE_APP_URL,
    VITE_SUPABASE_URL: source.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: source.VITE_SUPABASE_PUBLISHABLE_KEY,
  })

  if (!parsed.success) {
    throw new Error(CLIENT_ENV_ERROR)
  }

  return parsed.data
}

let cachedEnv: ClientEnv | undefined

export function getClientEnv(): ClientEnv {
  cachedEnv ??= parseClientEnv({
    VITE_APP_URL: import.meta.env.VITE_APP_URL,
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env
      .VITE_SUPABASE_PUBLISHABLE_KEY,
  })

  return cachedEnv
}

export function resetClientEnvCache(): void {
  cachedEnv = undefined
}
