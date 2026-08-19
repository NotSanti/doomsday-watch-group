import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/use-auth'
import {
  createGroup,
  deleteGroup,
  fetchGroup,
  leaveGroup,
  listGroupMembers,
  listGroups,
  removeGroupMember,
  transferGroupOwnership,
  updateGroupCurrentTitle,
  updateGroupSettings,
} from '@/features/groups/group-api'
import { groupKeys } from '@/features/groups/group-keys'
import {
  isGroupId,
  type CreateGroupValues,
  type UpdateGroupSettingsValues,
} from '@/features/groups/group-schemas'
import {
  toFriendlyDeleteGroupError,
  toFriendlyGroupSettingsError,
  toFriendlyLeaveGroupError,
  toFriendlyRemoveMemberError,
  toFriendlyTransferOwnershipError,
} from '@/features/groups/group-errors'
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

export function useUpdateGroupSettings(groupId: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: UpdateGroupSettingsValues) =>
      updateGroupSettings(getSupabaseClient(), groupId, values),
    onSuccess: (group) => {
      queryClient.setQueryData(groupKeys.detail(group.id), group)

      if (user) {
        void queryClient.invalidateQueries({
          queryKey: groupKeys.list(user.id),
        })
      }

      toast.success('Group details saved')
    },
    onError: (error) => {
      toast.error(toFriendlyGroupSettingsError(error))
    },
  })
}

export function useRemoveGroupMember(groupId: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) =>
      removeGroupMember(getSupabaseClient(), groupId, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: groupKeys.members(groupId),
      })
      void queryClient.invalidateQueries({ queryKey: groupKeys.all })

      if (user) {
        void queryClient.invalidateQueries({
          queryKey: groupKeys.memberLists(user.id),
        })
      }

      toast.success('Member removed')
    },
    onError: (error) => {
      toast.error(toFriendlyRemoveMemberError(error))
    },
  })
}

export function useLeaveGroup(groupId: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: () => leaveGroup(getSupabaseClient(), groupId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: groupKeys.detail(groupId) })
      queryClient.removeQueries({ queryKey: groupKeys.members(groupId) })

      if (user) {
        void queryClient.invalidateQueries({
          queryKey: groupKeys.list(user.id),
        })
        void queryClient.invalidateQueries({
          queryKey: groupKeys.memberLists(user.id),
        })
      }

      toast.success('You left the group')
      void navigate('/app')
    },
    onError: (error) => {
      toast.error(toFriendlyLeaveGroupError(error))
    },
  })
}

export function useTransferOwnership(groupId: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (newOwnerId: string) =>
      transferGroupOwnership(getSupabaseClient(), groupId, newOwnerId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: groupKeys.detail(groupId),
      })
      void queryClient.invalidateQueries({
        queryKey: groupKeys.members(groupId),
      })

      if (user) {
        void queryClient.invalidateQueries({
          queryKey: groupKeys.list(user.id),
        })
        void queryClient.invalidateQueries({
          queryKey: groupKeys.memberLists(user.id),
        })
      }

      toast.success('Ownership transferred')
    },
    onError: (error) => {
      toast.error(toFriendlyTransferOwnershipError(error))
    },
  })
}

export function useDeleteGroup(groupId: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: () => deleteGroup(getSupabaseClient(), groupId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: groupKeys.detail(groupId) })
      queryClient.removeQueries({ queryKey: groupKeys.members(groupId) })

      if (user) {
        void queryClient.invalidateQueries({
          queryKey: groupKeys.list(user.id),
        })
        void queryClient.invalidateQueries({
          queryKey: groupKeys.memberLists(user.id),
        })
      }

      toast.success('Group deleted')
      void navigate('/app')
    },
    onError: (error) => {
      toast.error(toFriendlyDeleteGroupError(error))
    },
  })
}
