const LIST_FALLBACK = 'The watchlist could not be loaded. Please try again.'
const DETAIL_FALLBACK = 'This title could not be loaded. Please try again.'

export function toFriendlyTitleListError(): string {
  return LIST_FALLBACK
}

export function toFriendlyTitleDetailError(): string {
  return DETAIL_FALLBACK
}
