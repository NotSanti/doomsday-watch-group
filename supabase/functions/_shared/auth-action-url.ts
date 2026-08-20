export type AuthEmailActionType =
  | 'signup'
  | 'invite'
  | 'magiclink'
  | 'recovery'
  | 'email_change'
  | 'email'
  | 'reauthentication'

export type BuildAuthActionUrlInput = {
  /** @deprecated Unused — links go to the SPA callback, not GoTrue /verify. */
  siteUrl?: string
  tokenHash: string
  emailActionType: AuthEmailActionType
  redirectTo: string
}

const AUTH_CALLBACK_PATH = '/auth/callback'

/**
 * Build an SPA `/auth/callback` URL with token_hash for client-side verifyOtp.
 *
 * Always uses the callback path (not Site URL `/`) so GoTrue's redirect_to
 * cannot drop users on the marketing home without exchanging the OTP.
 */
export function buildAuthActionUrl(input: BuildAuthActionUrlInput): string {
  const redirect = new URL(input.redirectTo)
  const callback = new URL(AUTH_CALLBACK_PATH, redirect.origin)

  // Preserve safe query params already on redirect_to (e.g. next=).
  redirect.searchParams.forEach((value, key) => {
    if (key === 'token_hash' || key === 'type') {
      return
    }

    callback.searchParams.set(key, value)
  })

  callback.searchParams.set('token_hash', input.tokenHash)
  callback.searchParams.set('type', input.emailActionType)
  return callback.toString()
}
