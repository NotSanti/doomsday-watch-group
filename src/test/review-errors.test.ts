import { describe, expect, it } from 'vitest'
import {
  toFriendlyReviewDeleteError,
  toFriendlyReviewListError,
  toFriendlyReviewSaveError,
} from '@/features/reviews/review-errors'
import {
  REVIEW_BODY_MAX,
  emptyToNull,
  reviewFormSchema,
} from '@/features/reviews/review-schemas'

describe('review errors and form schema', () => {
  it('maps constraint codes without exposing backend text', () => {
    expect(toFriendlyReviewSaveError({ code: '42501' })).toBe(
      'You can only edit your own review.',
    )
    expect(toFriendlyReviewSaveError({ code: '23505' })).toBe(
      'You already reviewed this title. Update your existing review instead.',
    )
    expect(toFriendlyReviewSaveError({ code: '23514' })).toBe(
      'Choose a rating from 1 to 10 in 0.5 steps. Reviews can be 2,000 characters or fewer.',
    )
    expect(toFriendlyReviewSaveError({ message: 'db exploded' })).toBe(
      'Your review could not be saved. Please try again.',
    )
    expect(toFriendlyReviewDeleteError()).toBe(
      'Your review could not be deleted. Please try again.',
    )
    expect(toFriendlyReviewListError()).toBe(
      'Reviews could not be loaded. Please try again.',
    )
  })

  it('rejects overlong bodies and treats blank text as null', () => {
    expect(emptyToNull('  ')).toBeNull()
    expect(emptyToNull(' Solid start. ')).toBe('Solid start.')
    expect(
      reviewFormSchema.safeParse({
        rating: 8,
        body: 'x'.repeat(REVIEW_BODY_MAX + 1),
        contains_spoilers: false,
      }).success,
    ).toBe(false)
    expect(
      reviewFormSchema.safeParse({
        rating: 8,
        body: 'Short',
        contains_spoilers: true,
      }).success,
    ).toBe(true)
  })
})
