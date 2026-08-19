export type ViteAppUrlSource = {
  VITE_APP_URL?: string
  VERCEL_URL?: string
  VERCEL_ENV?: string
}

export const PRODUCTION_APP_URL_ERROR =
  'Production builds require VITE_APP_URL to be set to the canonical public origin.'

function normalizeOrigin(value: string): string {
  const trimmed = value.trim()
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`

  return withProtocol.replace(/\/+$/, '')
}

export function resolveViteAppUrl(
  source: ViteAppUrlSource,
): string | undefined {
  const explicit = source.VITE_APP_URL?.trim()

  if (explicit) {
    return normalizeOrigin(explicit)
  }

  if (source.VERCEL_ENV === 'production') {
    throw new Error(PRODUCTION_APP_URL_ERROR)
  }

  const vercelUrl = source.VERCEL_URL?.trim()

  if (vercelUrl) {
    return normalizeOrigin(vercelUrl)
  }

  return undefined
}

export function applyViteAppUrl(env: Record<string, string | undefined>): void {
  const resolved = resolveViteAppUrl({
    VITE_APP_URL: env.VITE_APP_URL,
    VERCEL_URL: env.VERCEL_URL,
    VERCEL_ENV: env.VERCEL_ENV,
  })

  if (resolved) {
    env.VITE_APP_URL = resolved
  }
}
