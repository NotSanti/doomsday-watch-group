import type { QueryClient } from '@tanstack/react-query'
import { listGroupMembers } from '@/features/groups/group-api'
import { groupKeys } from '@/features/groups/group-keys'
import { isGroupId } from '@/features/groups/group-schemas'
import { listGroupProgress } from '@/features/progress/progress-api'
import { progressKeys } from '@/features/progress/progress-keys'
import { listGroupSkippedTitles } from '@/features/watchlist/skip-api'
import { skipKeys } from '@/features/watchlist/skip-keys'
import { listTitles } from '@/features/watchlist/title-api'
import { titleKeys } from '@/features/watchlist/title-keys'
import { getSupabaseClient } from '@/lib/supabase'

export function prefetchMembersPage(
  queryClient: QueryClient,
  groupId: string,
): void {
  if (!isGroupId(groupId)) {
    return
  }

  const client = getSupabaseClient()

  void queryClient.prefetchQuery({
    queryKey: groupKeys.members(groupId),
    queryFn: () => listGroupMembers(client, [groupId]),
  })
  void queryClient.prefetchQuery({
    queryKey: progressKeys.group(groupId),
    queryFn: () => listGroupProgress(client, groupId),
  })
  void queryClient.prefetchQuery({
    queryKey: titleKeys.list(),
    queryFn: () => listTitles(client),
  })
  void queryClient.prefetchQuery({
    queryKey: skipKeys.group(groupId),
    queryFn: () => listGroupSkippedTitles(client, groupId),
  })
}
