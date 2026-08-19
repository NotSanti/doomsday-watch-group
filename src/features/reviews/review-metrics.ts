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
  return reviews
    .filter((review) => review.title_id === titleId)
    .map((review) => review.rating)
}
