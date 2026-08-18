const CREATE_FALLBACK = 'The invite could not be created. Please try again.'
const LIST_FALLBACK = 'Invites could not be loaded. Please try again.'
const PREVIEW_FALLBACK = 'This invite could not be checked. Please try again.'
const REDEEM_FALLBACK = 'You could not join this group. Please try again.'
const REVOKE_FALLBACK = 'The invite could not be revoked. Please try again.'

const INVALID_INVITE = 'This invite is not valid.'
const REVOKED_INVITE = 'This invite was revoked.'
const EXPIRED_INVITE = 'This invite has expired.'
const EXHAUSTED_INVITE = 'This invite has no remaining uses.'

type ErrorLike = {
  code?: string | null
  message?: string | null
}

function readError(error: unknown): ErrorLike {
  if (!error || typeof error !== 'object') {
    return {}
  }

  return error as ErrorLike
}

function messageOf(error: unknown): string {
  return readError(error).message?.toLowerCase() ?? ''
}

export function toFriendlyInvitePreviewReason(reason: string | null): string {
  if (reason === 'revoked') {
    return REVOKED_INVITE
  }

  if (reason === 'expired') {
    return EXPIRED_INVITE
  }

  if (reason === 'exhausted') {
    return EXHAUSTED_INVITE
  }

  return INVALID_INVITE
}

export function toFriendlyCreateInviteError(error: unknown): string {
  if (readError(error).code === '42501') {
    return 'Only the group owner can create invites.'
  }

  return CREATE_FALLBACK
}

export function toFriendlyInviteListError(): string {
  return LIST_FALLBACK
}

export function toFriendlyInvitePreviewError(): string {
  return PREVIEW_FALLBACK
}

export function toFriendlyRedeemInviteError(error: unknown): string {
  const { code } = readError(error)
  const message = messageOf(error)

  if (code === '42501') {
    return 'Sign in to join this group.'
  }

  if (message.includes('revoked')) {
    return REVOKED_INVITE
  }

  if (message.includes('expired')) {
    return EXPIRED_INVITE
  }

  if (message.includes('remaining uses') || message.includes('exhausted')) {
    return EXHAUSTED_INVITE
  }

  if (message.includes('not valid')) {
    return INVALID_INVITE
  }

  return REDEEM_FALLBACK
}

export function toFriendlyRevokeInviteError(error: unknown): string {
  if (readError(error).code === '42501') {
    return 'Only the group owner can revoke invites.'
  }

  return REVOKE_FALLBACK
}
