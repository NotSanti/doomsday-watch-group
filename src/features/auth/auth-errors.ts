const FRIENDLY_AUTH_ERROR = 'Something went wrong. Please try again.'

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'That email or password is incorrect.',
  email_exists: 'An account with that email already exists. Try signing in.',
  user_already_exists:
    'An account with that email already exists. Try signing in.',
  weak_password: 'Choose a stronger password with at least 8 characters.',
  over_email_send_rate_limit:
    'Please wait a moment before requesting another email.',
  over_request_rate_limit: 'Too many attempts. Wait a moment and try again.',
  email_not_confirmed: 'Confirm your email before signing in.',
  signup_disabled: 'New accounts cannot be created right now.',
  same_password: 'Choose a password that is different from your current one.',
  validation_failed: 'Check the form and try again.',
  user_not_found: 'If that email is registered, a reset link is on the way.',
}

type AuthLikeError = {
  code?: string | null
  message?: string | null
}

export function toFriendlyAuthError(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return FRIENDLY_AUTH_ERROR
  }

  const authError = error as AuthLikeError
  const code = authError.code?.trim()

  if (code && AUTH_ERROR_MESSAGES[code]) {
    return AUTH_ERROR_MESSAGES[code]
  }

  return FRIENDLY_AUTH_ERROR
}

export function toFriendlyProfileError(): string {
  return 'Your profile could not be loaded. Please try again.'
}
