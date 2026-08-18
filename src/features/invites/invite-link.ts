export function invitePath(token: string): string {
  return `/invite/${token}`
}

export function inviteUrl(appUrl: string, token: string): string {
  return `${appUrl.replace(/\/$/, '')}${invitePath(token)}`
}

export function parseInviteToken(input: string): string {
  const trimmed = input.trim()

  if (!trimmed) {
    return ''
  }

  try {
    const url = new URL(trimmed)
    const segments = url.pathname.split('/').filter(Boolean)
    const inviteIndex = segments.lastIndexOf('invite')
    const fromUrl = inviteIndex >= 0 ? segments[inviteIndex + 1] : undefined

    if (fromUrl) {
      return fromUrl
    }
  } catch {
    const relative = /\/invite\/([^/?#]+)/.exec(trimmed)
    if (relative?.[1]) {
      return relative[1]
    }
  }

  return trimmed.replace(/^\/invite\//, '')
}
