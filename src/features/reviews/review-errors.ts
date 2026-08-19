const SAVE_FALLBACK = 'Your review could not be saved. Please try again.'
const DELETE_FALLBACK = 'Your review could not be deleted. Please try again.'
const LIST_FALLBACK = 'Reviews could not be loaded. Please try again.'

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

export function toFriendlyReviewSaveError(error: unknown): string {
  const { code } = readError(error)

  if (code === '42501') {
    return 'You can only edit your own review.'
  }

  if (code === '23505') {
    return 'You already reviewed this title. Update your existing review instead.'
  }

  if (code === '23514') {
    return 'Choose a rating from 1 to 10 in 0.5 steps. Reviews can be 2,000 characters or fewer.'
  }

  return SAVE_FALLBACK
}

export function toFriendlyReviewDeleteError(): string {
  return DELETE_FALLBACK
}

export function toFriendlyReviewListError(): string {
  return LIST_FALLBACK
}
