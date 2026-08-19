import { describe, expect, it } from 'vitest'
import {
  averageRating,
  formatAverageRatingLabel,
  formatRating,
  ratingDistribution,
  ratingsForTitle,
} from '@/features/reviews/review-metrics'
import { isValidRating, ratingValueSchema } from '@/features/reviews/review-schemas'

describe('review metrics', () => {
  it('accepts 1–10 ratings in 0.5 increments only', () => {
    expect(isValidRating(1)).toBe(true)
    expect(isValidRating(8.5)).toBe(true)
    expect(isValidRating(10)).toBe(true)
    expect(isValidRating(8.3)).toBe(false)
    expect(isValidRating(0.5)).toBe(false)
    expect(isValidRating(10.5)).toBe(false)
    expect(ratingValueSchema.safeParse(8.3).success).toBe(false)
    expect(ratingValueSchema.safeParse(8.5).success).toBe(true)
  })

  it('averages ratings to one decimal and builds 19 buckets', () => {
    expect(averageRating([])).toBeNull()
    expect(averageRating([8, 9, 10])).toBe(9)
    expect(averageRating([8.5, 9])).toBe(8.8)

    const buckets = ratingDistribution([8, 8, 9])
    expect(buckets).toHaveLength(19)
    expect(buckets.find((bucket) => bucket.value === 8)?.count).toBe(2)
    expect(buckets.find((bucket) => bucket.value === 9)?.count).toBe(1)
    expect(buckets.find((bucket) => bucket.value === 7.5)?.count).toBe(0)
  })

  it('formats labels and filters ratings for a title', () => {
    expect(formatRating(8)).toBe('8')
    expect(formatRating(8.5)).toBe('8.5')
    expect(formatAverageRatingLabel(null, 0)).toBe('No ratings')
    expect(formatAverageRatingLabel(8.5, 2)).toBe('Avg 8.5')
    expect(
      ratingsForTitle(
        [
          { title_id: 'aa000000-0000-4000-8000-000000000001', rating: 8 },
          { title_id: 'aa000000-0000-4000-8000-000000000002', rating: 4 },
        ],
        'aa000000-0000-4000-8000-000000000001',
      ),
    ).toEqual([8])
  })
})
