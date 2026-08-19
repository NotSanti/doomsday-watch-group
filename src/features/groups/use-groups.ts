import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/use-auth'
import {
  createGroup,
  fetchGroup,
  listGroupMembers,
  listGroups,
  updateGroupCurrentTitle,
} from '@/features/groups/group-api'
import { groupKeys } from '@/features/groups/group-keys'
import {
  isGroupId,
  type CreateGroupValues,
} from '@/features/groups/group-schemas'
import { toFriendlyCurrentTitleError } from '@/features/progress/progress-errors'
import { getSupabaseClient } from '@/lib/supabase'

export function useGroupList() {
  const { user } = useAuth()
  const userId = user?.id ?? ''

  return useQuery({
    queryKey: groupKeys.list(userId),
    queryFn: () => listGroups(getSupabaseClient()),
    enabled: Boolean(userId),
  })
}

export function useGroup(groupId: string) {
  return useQuery({
    queryKey: groupKeys.detail(groupId),
    queryFn: () => fetchGroup(getSupabaseClient(), groupId),
    enabled: isGroupId(groupId),
  })
}

export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: groupKeys.members(groupId),
    queryFn: () => listGroupMembers(getSupabaseClient(), [groupId]),
    enabled: isGroupId(groupId),
  })
}

export function useGroupMemberLists(groupIds: string[]) {
  const { user } = useAuth()
  const userId = user?.id ?? ''
  const ids = [...groupIds].sort()

  return useQuery({
    queryKey: [...groupKeys.memberLists(userId), ids.join(',')],
    queryFn: () => listGroupMembers(getSupabaseClient(), ids),
    enabled: Boolean(userId) && ids.length > 0,
  })
}

export function useCreateGroup() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (values: CreateGroupValues) =>
      createGroup(getSupabaseClient(), values),
    onSuccess: (group) => {
      queryClient.setQueryData(groupKeys.detail(group.id), group)

      if (user) {
        void queryClient.invalidateQueries({
          queryKey: groupKeys.list(user.id),
        })
        void queryClient.invalidateQueries({
          queryKey: groupKeys.memberLists(user.id),
        })
      }

      void queryClient.invalidateQueries({
        queryKey: groupKeys.members(group.id),
      })

      toast.success('Group created')
      void navigate(`/groups/${group.id}`)
    },
  })
}

export function useSetCurrentTitle(groupId: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (titleId: string | null) =>
      updateGroupCurrentTitle(getSupabaseClient(), groupId, titleId),
    onSuccess: (group) => {
      queryClient.setQueryData(groupKeys.detail(group.id), group)

      if (user) {
        void queryClient.invalidateQueries({
          queryKey: groupKeys.list(user.id),
        })
      }

      toast.success('Current title updated')
    },
    onError: (error) => {
      toast.error(toFriendlyCurrentTitleError(error))
    },
  })
}
