import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/use-auth'
import { isGroupId } from '@/features/groups/group-schemas'
import {
  deleteMyReview,
  listGroupReviews,
  saveMyReview,
} from '@/features/reviews/review-api'
import {
  toFriendlyReviewDeleteError,
  toFriendlyReviewSaveError,
} from '@/features/reviews/review-errors'
import { reviewKeys } from '@/features/reviews/review-keys'
import type { ReviewFormValues } from '@/features/reviews/review-schemas'
import { getSupabaseClient } from '@/lib/supabase'

export function useGroupReviews(groupId: string) {
  return useQuery({
    queryKey: reviewKeys.group(groupId),
    queryFn: () => listGroupReviews(getSupabaseClient(), groupId),
    enabled: isGroupId(groupId),
  })
}

export function useSaveReview(groupId: string, titleId: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id ?? ''

  return useMutation({
    mutationFn: (input: { existingId?: string; values: ReviewFormValues }) =>
      saveMyReview(getSupabaseClient(), {
        groupId,
        userId,
        titleId,
        existingId: input.existingId,
        values: input.values,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: reviewKeys.group(groupId),
      })
      toast.success('Review saved')
    },
    onError: (error) => {
      toast.error(toFriendlyReviewSaveError(error))
    },
  })
}

export function useDeleteReview(groupId: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id ?? ''

  return useMutation({
    mutationFn: (reviewId: string) =>
      deleteMyReview(getSupabaseClient(), { reviewId, userId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: reviewKeys.group(groupId),
      })
      toast.success('Review deleted')
    },
    onError: () => {
      toast.error(toFriendlyReviewDeleteError())
    },
  })
}

export function useReviewRealtime(groupId: string) {
  const queryClient = useQueryClient()
  const enabled = isGroupId(groupId)

  useEffect(() => {
    if (!enabled) {
      return
    }

    const client = getSupabaseClient()
    const channel = client
      .channel(`group-reviews:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: reviewKeys.group(groupId),
          })
        },
      )
      .subscribe()

    return () => {
      void client.removeChannel(channel)
    }
  }, [enabled, groupId, queryClient])
}
