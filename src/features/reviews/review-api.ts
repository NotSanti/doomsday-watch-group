import { z } from 'zod'
import type { BrowserSupabaseClient } from '@/lib/supabase'
import {
  emptyToNull,
  reviewRowSchema,
  type ReviewFormValues,
  type ReviewRow,
} from '@/features/reviews/review-schemas'

const REVIEW_COLUMNS =
  'id, group_id, user_id, title_id, rating, body, contains_spoilers, created_at, updated_at'

export async function listGroupReviews(
  client: BrowserSupabaseClient,
  groupId: string,
): Promise<ReviewRow[]> {
  const { data, error } = await client
    .from('reviews')
    .select(REVIEW_COLUMNS)
    .eq('group_id', groupId)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return z.array(reviewRowSchema).parse(data ?? [])
}

export async function saveMyReview(
  client: BrowserSupabaseClient,
  input: {
    groupId: string
    userId: string
    titleId: string
    existingId?: string
    values: ReviewFormValues
  },
): Promise<ReviewRow> {
  const payload = {
    rating: input.values.rating,
    body: emptyToNull(input.values.body),
    contains_spoilers: input.values.contains_spoilers,
  }

  if (input.existingId) {
    const { data, error } = await client
      .from('reviews')
      .update(payload)
      .eq('id', input.existingId)
      .eq('user_id', input.userId)
      .select(REVIEW_COLUMNS)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!data) {
      throw new Error('REVIEW_UPDATE_FAILED')
    }

    return reviewRowSchema.parse(data)
  }

  const { data, error } = await client
    .from('reviews')
    .insert({
      group_id: input.groupId,
      user_id: input.userId,
      title_id: input.titleId,
      ...payload,
    })
    .select(REVIEW_COLUMNS)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error('REVIEW_INSERT_FAILED')
  }

  return reviewRowSchema.parse(data)
}

export async function deleteMyReview(
  client: BrowserSupabaseClient,
  input: { reviewId: string; userId: string },
): Promise<void> {
  const { error } = await client
    .from('reviews')
    .delete()
    .eq('id', input.reviewId)
    .eq('user_id', input.userId)

  if (error) {
    throw error
  }
}
