import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { groupKeys } from '@/features/groups/group-keys'
import { isGroupId } from '@/features/groups/group-schemas'
import { progressKeys } from '@/features/progress/progress-keys'
import { reviewKeys } from '@/features/reviews/review-keys'
import {
  registerRealtimeChannel,
  scheduleQueryInvalidation,
  unregisterRealtimeChannel,
} from '@/lib/realtime'
import { getSupabaseClient } from '@/lib/supabase'

export function useActiveGroupRealtime(
  groupId: string,
  userId: string | undefined,
): void {
  const queryClient = useQueryClient()
  const enabled = isGroupId(groupId) && Boolean(userId)

  useEffect(() => {
    if (!enabled || !userId) {
      return
    }

    const client = getSupabaseClient()
    const channel = client
      .channel(`group-live:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'member_title_progress',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          scheduleQueryInvalidation(
            queryClient,
            progressKeys.group(groupId),
          )
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
          scheduleQueryInvalidation(queryClient, groupKeys.detail(groupId))
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          scheduleQueryInvalidation(queryClient, reviewKeys.group(groupId))
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          scheduleQueryInvalidation(queryClient, groupKeys.members(groupId))
          scheduleQueryInvalidation(queryClient, groupKeys.list(userId))
          scheduleQueryInvalidation(
            queryClient,
            groupKeys.memberLists(userId),
          )
        },
      )
      .subscribe()

    registerRealtimeChannel(channel)

    return () => {
      unregisterRealtimeChannel(channel)
      void client.removeChannel(channel)
    }
  }, [enabled, groupId, queryClient, userId])
}
