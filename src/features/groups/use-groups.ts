import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/use-auth'
import {
  createGroup,
  fetchGroup,
  listGroups,
} from '@/features/groups/group-api'
import { groupKeys } from '@/features/groups/group-keys'
import {
  isGroupId,
  type CreateGroupValues,
} from '@/features/groups/group-schemas'
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
      }

      toast.success('Group created')
      void navigate(`/groups/${group.id}`)
    },
  })
}
