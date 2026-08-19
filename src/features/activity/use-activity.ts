import { useQuery } from '@tanstack/react-query'
import { listGroupActivity } from '@/features/activity/activity-api'
import { activityKeys } from '@/features/activity/activity-keys'
import { isGroupId } from '@/features/groups/group-schemas'
import { getSupabaseClient } from '@/lib/supabase'

export function useGroupActivity(groupId: string) {
  return useQuery({
    queryKey: activityKeys.group(groupId),
    queryFn: () => listGroupActivity(getSupabaseClient(), groupId),
    enabled: isGroupId(groupId),
  })
}
