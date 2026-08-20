export type AuthEmailActionType =
  | 'signup'
  | 'invite'
  | 'magiclink'
  | 'recovery'
  | 'email_change'
  | 'email'
  | 'reauthentication'

export type BuildAuthActionUrlInput = {
  siteUrl: string
  tokenHash: string
  emailActionType: AuthEmailActionType
  redirectTo: string
}

/** Build the GoTrue verify URL Supabase would normally embed in auth emails. */
export function buildAuthActionUrl(input: BuildAuthActionUrlInput): string {
  const siteUrl = input.siteUrl.replace(/\/$/, '')
  const params = new URLSearchParams({
    token: input.tokenHash,
    type: input.emailActionType,
    redirect_to: input.redirectTo,
  })

  return `${siteUrl}/auth/v1/verify?${params.toString()}`
}
