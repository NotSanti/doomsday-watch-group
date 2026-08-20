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

/**
 * Build an app callback URL with token_hash for client-side verifyOtp.
 * Avoids linking to /auth/v1/verify (Kong requires an apikey on that route).
 */
export function buildAuthActionUrl(input: BuildAuthActionUrlInput): string {
  const url = new URL(input.redirectTo)
  url.searchParams.set('token_hash', input.tokenHash)
  url.searchParams.set('type', input.emailActionType)
  return url.toString()
}
