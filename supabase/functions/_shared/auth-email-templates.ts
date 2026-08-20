import type { AuthEmailActionType } from './auth-action-url.ts'

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
