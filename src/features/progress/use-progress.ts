import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/use-auth'
import { groupKeys } from '@/features/groups/group-keys'
import { isGroupId } from '@/features/groups/group-schemas'
import {
  listGroupProgress,
  setMyTitleStatus,
} from '@/features/progress/progress-api'
import { toFriendlyProgressError } from '@/features/progress/progress-errors'
import { progressKeys } from '@/features/progress/progress-keys'
import type { GroupProgressRow } from '@/features/progress/progress-schemas'
import type { TitleStatus } from '@/features/watchlist/title-schemas'
import { getSupabaseClient } from '@/lib/supabase'

export function useGroupProgress(groupId: string) {
  return useQuery({
    queryKey: progressKeys.group(groupId),
    queryFn: () => listGroupProgress(getSupabaseClient(), groupId),
    enabled: isGroupId(groupId),
  })
}

export function useSetTitleStatus(groupId: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id ?? ''

  return useMutation({
    mutationFn: (input: { titleId: string; status: TitleStatus }) =>
      setMyTitleStatus(getSupabaseClient(), {
        groupId,
        userId,
        titleId: input.titleId,
        status: input.status,
      }),
    onMutate: async (input) => {
      const queryKey = progressKeys.group(groupId)
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<GroupProgressRow[]>(queryKey)

      queryClient.setQueryData<GroupProgressRow[]>(queryKey, (current) =>
        applyLocalStatus(current ?? [], {
          groupId,
          userId,
          titleId: input.titleId,
          status: input.status,
        }),
      )

      return { previous }
    },
    onError: (error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(progressKeys.group(groupId), context.previous)
      }

      toast.error(toFriendlyProgressError(error))
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: progressKeys.group(groupId),
      })
    },
  })
}

export function useGroupRealtime(groupId: string) {
  const queryClient = useQueryClient()
  const enabled = isGroupId(groupId)

  useEffect(() => {
    if (!enabled) {
      return
    }

    const client = getSupabaseClient()
    const channel = client
      .channel(`group-progress:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'member_title_progress',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: progressKeys.group(groupId),
          })
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'groups',
          filter: `id=eq.${groupId}`,
        },
        () => {
          void queryClient.invalidateQueries({
            queryKey: groupKeys.detail(groupId),
          })
        },
      )
      .subscribe()

    return () => {
      void client.removeChannel(channel)
    }
  }, [enabled, groupId, queryClient])
}

function applyLocalStatus(
  rows: GroupProgressRow[],
  input: {
    groupId: string
    userId: string
    titleId: string
    status: TitleStatus
  },
): GroupProgressRow[] {
  const withoutCurrent = rows.filter(
    (row) =>
      !(row.user_id === input.userId && row.title_id === input.titleId),
  )

  if (input.status === 'not_started') {
    return withoutCurrent
  }

  const existing = rows.find(
    (row) => row.user_id === input.userId && row.title_id === input.titleId,
  )
  const now = new Date().toISOString()

  return [
    ...withoutCurrent,
    {
      group_id: input.groupId,
      user_id: input.userId,
      title_id: input.titleId,
      status: input.status,
      started_at:
        input.status === 'watching' || input.status === 'watched'
          ? (existing?.started_at ?? now)
          : null,
      watched_at: input.status === 'watched' ? now : null,
    },
  ]
}
