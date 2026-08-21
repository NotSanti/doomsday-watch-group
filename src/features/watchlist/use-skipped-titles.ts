import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/use-auth'
import { isGroupId } from '@/features/groups/group-schemas'
import {
  listGroupSkippedTitles,
  skipGroupTitle,
  unskipGroupTitle,
} from '@/features/watchlist/skip-api'
import { toFriendlySkipError } from '@/features/watchlist/skip-errors'
import { skipKeys } from '@/features/watchlist/skip-keys'
import type { GroupSkippedTitle } from '@/features/watchlist/skip-schemas'
import { getSupabaseClient } from '@/lib/supabase'

export function useGroupSkippedTitles(groupId: string) {
  return useQuery({
    queryKey: skipKeys.group(groupId),
    queryFn: () => listGroupSkippedTitles(getSupabaseClient(), groupId),
    enabled: isGroupId(groupId),
  })
}

export function useToggleGroupTitleSkip(groupId: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id ?? ''

  return useMutation({
    mutationFn: async (input: { titleId: string; skipped: boolean }) => {
      if (input.skipped) {
        await skipGroupTitle(getSupabaseClient(), {
          groupId,
          titleId: input.titleId,
          userId,
        })
        return
      }

      await unskipGroupTitle(getSupabaseClient(), {
        groupId,
        titleId: input.titleId,
      })
    },
    onMutate: async (input) => {
      const queryKey = skipKeys.group(groupId)
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<GroupSkippedTitle[]>(queryKey)

      queryClient.setQueryData<GroupSkippedTitle[]>(queryKey, (current) => {
        const rows = current ?? []
        if (input.skipped) {
          if (rows.some((row) => row.title_id === input.titleId)) {
            return rows
          }

          return [
            ...rows,
            {
              group_id: groupId,
              title_id: input.titleId,
              skipped_by: userId,
              skipped_at: new Date().toISOString(),
            },
          ]
        }

        return rows.filter((row) => row.title_id !== input.titleId)
      })

      return { previous }
    },
    onError: (error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(skipKeys.group(groupId), context.previous)
      }

      toast.error(toFriendlySkipError(error))
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: skipKeys.group(groupId) })
    },
  })
}
