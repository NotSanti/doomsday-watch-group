import { describe, expect, it } from 'vitest'
import {
  averageRating,
  formatAverageRatingLabel,
  formatRating,
  ratingsForTitle,
  starFill,
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

  it('averages ratings to one decimal and fills stars including halves', () => {
    expect(averageRating([])).toBeNull()
    expect(averageRating([8, 9, 10])).toBe(9)
    expect(averageRating([8.5, 9])).toBe(8.8)

    expect(starFill(9, 9.5)).toBe(1)
    expect(starFill(10, 9.5)).toBe(0.5)
    expect(starFill(10, 9)).toBe(0)
    expect(starFill(1, null)).toBe(0)
    expect(starFill(4, 4)).toBe(1)
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
