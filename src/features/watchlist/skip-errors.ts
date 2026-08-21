export function toFriendlySkipListError(): string {
  return 'Skipped titles could not be loaded. Please try again.'
}

export function toFriendlySkipError(error: unknown): string {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: unknown }).code)
      : ''

  if (code === '42501' || code === 'PGRST301') {
    return 'Only the group owner can skip titles on the watchlist.'
  }

  return 'That skip could not be updated. Please try again.'
}
