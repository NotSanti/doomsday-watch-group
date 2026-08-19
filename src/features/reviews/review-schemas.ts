import { z } from 'zod'

export const REVIEW_BODY_MAX = 2000
export const RATING_MIN = 1
export const RATING_MAX = 10
export const RATING_STEP = 0.5

export const RATING_STEPS: number[] = Array.from(
  { length: 19 },
  (_, index) => RATING_MIN + index * RATING_STEP,
)

export function isValidRating(value: number): boolean {
  if (!Number.isFinite(value) || value < RATING_MIN || value > RATING_MAX) {
    return false
  }

  return Math.abs(value * 2 - Math.round(value * 2)) < 1e-8
}

export const ratingValueSchema = z
  .number({ error: 'Choose a rating from 1 to 10.' })
  .refine(isValidRating, 'Choose a rating from 1 to 10 in 0.5 steps.')

const ratingFromApiSchema = z.preprocess((value) => {
  if (typeof value === 'string' && value.trim() !== '') {
    return Number(value)
  }

  return value
}, ratingValueSchema)

export const reviewRowSchema = z.object({
  id: z.string().uuid(),
  group_id: z.string().uuid(),
  user_id: z.string().uuid(),
  title_id: z.string().uuid(),
  rating: ratingFromApiSchema,
  body: z.string().nullable(),
  contains_spoilers: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const reviewFormSchema = z.object({
  rating: ratingValueSchema,
  body: z
    .string()
    .max(REVIEW_BODY_MAX, 'Use 2,000 characters or fewer.'),
  contains_spoilers: z.boolean(),
})

export type ReviewRow = z.infer<typeof reviewRowSchema>
export type ReviewFormValues = z.infer<typeof reviewFormSchema>

export function isReviewFormUnchanged(
  existing: ReviewRow | null,
  values: {
    rating?: number
    body: string
    contains_spoilers: boolean
  },
): boolean {
  if (!existing) {
    return false
  }

  const ratingMatches =
    typeof values.rating === 'number' &&
    Math.abs(values.rating - existing.rating) < 1e-8
  const bodyMatches = (values.body ?? '').trim() === (existing.body ?? '').trim()

  return (
    ratingMatches &&
    bodyMatches &&
    values.contains_spoilers === existing.contains_spoilers
  )
}

export function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}
