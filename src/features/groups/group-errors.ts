const CREATE_FALLBACK = 'Your group could not be saved. Please try again.'
const LIST_FALLBACK = 'Your groups could not be loaded. Please try again.'
const DETAIL_FALLBACK = 'This group could not be loaded. Please try again.'

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

export function toFriendlyCreateGroupError(error: unknown): string {
  const { code } = readError(error)

  if (code === '42501') {
    return 'Sign in again to create a group.'
  }

  if (code === '23514') {
    return 'Group name must be 3 to 60 characters. Description can be 280 characters or fewer.'
  }

  return CREATE_FALLBACK
}

export function toFriendlyGroupListError(): string {
  return LIST_FALLBACK
}

export function toFriendlyGroupDetailError(): string {
  return DETAIL_FALLBACK
}
