const PROGRESS_FALLBACK = 'Progress could not be updated. Please try again.'
const CURRENT_TITLE_FALLBACK =
  'The current title could not be updated. Please try again.'

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

export function toFriendlyProgressError(error: unknown): string {
  const { code } = readError(error)

  if (code === '42501') {
    return 'You can only update your own watch status.'
  }

  return PROGRESS_FALLBACK
}

export function toFriendlyCurrentTitleError(error: unknown): string {
  const { code } = readError(error)

  if (code === '42501') {
    return 'Only the group owner can change the current title.'
  }

  return CURRENT_TITLE_FALLBACK
}

export function toFriendlyProgressListError(): string {
  return 'Group progress could not be loaded. Please try again.'
}
