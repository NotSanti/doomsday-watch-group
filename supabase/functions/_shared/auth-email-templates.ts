import type { AuthEmailActionType } from './auth-action-url.ts'

/** Strip quotes and the GoTrue `v1,whsec_` prefix so standardwebhooks can decode the secret. */
export function normalizeHookSecret(raw: string): string {
  return raw.trim().replaceAll(/^["']|["']$/g, '').replace(/^v1,whsec_/, '')
}

/** Resend expects `Display Name <email@domain>` without literal quote characters. */
export function normalizeResendFromAddress(raw: string): string {
  return formatResendFromAddress(parseResendFromAddress(raw))
}

export function parseResendFromAddress(raw: string): {
  name?: string
  email: string
} {
  let value = raw.trim()
  while (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim()
  }

  const stripQuotes = (part: string) =>
    part.replaceAll(/["'""''`]/g, '').trim()

  const bracketMatch = value.match(/^(.+?)\s*<([^>]+)>$/)
  if (bracketMatch) {
    const rawName = bracketMatch[1]
    const rawEmail = bracketMatch[2]
    if (rawName === undefined || rawEmail === undefined) {
      throw new Error('Invalid RESEND_FROM_EMAIL format')
    }

    const name = stripQuotes(rawName)
    const email = stripQuotes(rawEmail)
    return name.length > 0 ? { name, email } : { email }
  }

  const email = stripQuotes(value)
  if (!email.includes('@')) {
    throw new Error('Invalid RESEND_FROM_EMAIL format')
  }

  return { email }
}

export function formatResendFromAddress(input: {
  name?: string
  email: string
}): string {
  const email = input.email.trim()
  const name = input.name?.trim()
  return name && name.length > 0 ? `${name} <${email}>` : email
}

export function resolveResendFromAddress(
  env: Record<string, string | undefined>,
): string {
  const name = env.RESEND_FROM_NAME?.trim()
  const address = env.RESEND_FROM_ADDRESS?.trim()

  if (address && address.length > 0) {
    return formatResendFromAddress({
      name: name && name.length > 0 ? name.replaceAll(/["'""''`]/g, '') : undefined,
      email: address.replaceAll(/["'""''`]/g, ''),
    })
  }

  const combined = env.RESEND_FROM_EMAIL?.trim()
  if (!combined) {
    throw new Error('Missing edge function secret: RESEND_FROM_EMAIL')
  }

  return normalizeResendFromAddress(combined)
}

const SUPPORTED_ACTIONS = new Set<AuthEmailActionType>([
  'signup',
  'recovery',
  'magiclink',
  'invite',
  'email_change',
  'email',
  'reauthentication',
])

export function isSupportedAuthEmailAction(
  value: string,
): value is AuthEmailActionType {
  return SUPPORTED_ACTIONS.has(value as AuthEmailActionType)
}

export function resolveAuthEmailTemplateId(
  emailActionType: AuthEmailActionType,
  env: Record<string, string | undefined>,
): string {
  switch (emailActionType) {
    case 'signup':
      return requireEnv(env, 'RESEND_TEMPLATE_CONFIRM_SIGNUP')
    case 'recovery':
      return requireEnv(env, 'RESEND_TEMPLATE_PASSWORD_RESET')
    default:
      return requireEnv(env, 'RESEND_TEMPLATE_AUTH_ACTION')
  }
}

function requireEnv(
  env: Record<string, string | undefined>,
  key: string,
): string {
  const value = env[key]?.trim()
  if (!value) {
    throw new Error(`Missing edge function secret: ${key}`)
  }

  return value
}

export function resolveUserDisplayName(
  userMetadata: Record<string, unknown> | undefined,
): string {
  const displayName = userMetadata?.display_name
  if (typeof displayName === 'string' && displayName.trim().length > 0) {
    return displayName.trim()
  }

  return 'there'
}
