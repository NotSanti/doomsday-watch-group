export function averageRating(ratings: readonly number[]): number | null {
  if (ratings.length === 0) {
    return null
  }

  const total = ratings.reduce((sum, rating) => sum + rating, 0)
  return Math.round((total / ratings.length) * 10) / 10
}

export function starFill(star: number, rating: number | null): 0 | 0.5 | 1 {
  if (rating === null || rating < star - 0.5) {
    return 0
  }

  if (rating >= star) {
    return 1
  }

  return 0.5
}

export function visibleStarCount(rating: number): number {
  return Math.max(1, Math.ceil(rating))
}

export function formatRating(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

export function formatAverageRatingLabel(
  average: number | null,
  count: number,
): string {
  if (average === null || count === 0) {
    return 'No ratings'
  }

  return `Avg ${formatRating(average)}`
}

export function ratingsForTitle(
  reviews: readonly { title_id: string; rating: number }[],
  titleId: string,
): number[] {
  return reviewsForTitle(reviews, titleId).map((review) => review.rating)
}

export function reviewsForTitle<T extends { title_id: string }>(
  reviews: readonly T[],
  titleId: string,
): T[] {
  return reviews.filter((review) => review.title_id === titleId)
}

export function reviewHoverPreview(
  review: { body: string | null; contains_spoilers: boolean },
  isOwn: boolean,
): string {
  if (!review.body) {
    return 'Rated without a written review.'
  }

  if (review.contains_spoilers && !isOwn) {
    return 'This review contains spoilers.'
  }

  const trimmed = review.body.trim()

  if (trimmed.length <= 140) {
    return trimmed
  }

  return `${trimmed.slice(0, 139).trimEnd()}…`
}
