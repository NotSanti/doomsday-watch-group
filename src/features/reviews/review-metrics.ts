export const RATING_STEPS_COUNT = 19

export function averageRating(ratings: readonly number[]): number | null {
  if (ratings.length === 0) {
    return null
  }

  const total = ratings.reduce((sum, rating) => sum + rating, 0)
  return Math.round((total / ratings.length) * 10) / 10
}

export function ratingDistribution(
  ratings: readonly number[],
): { value: number; count: number }[] {
  const counts = new Map<number, number>()

  for (const rating of ratings) {
    const key = Math.round(rating * 2) / 2
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  return Array.from({ length: RATING_STEPS_COUNT }, (_, index) => {
    const value = 1 + index * 0.5
    return { value, count: counts.get(value) ?? 0 }
  })
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
