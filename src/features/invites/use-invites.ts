import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useAuth } from '@/features/auth/use-auth'
import { groupKeys } from '@/features/groups/group-keys'
import {
  createInvite,
  listInvites,
  previewInvite,
  redeemInvite,
  revokeInvite,
} from '@/features/invites/invite-api'
import { inviteKeys } from '@/features/invites/invite-keys'
import type { CreateInviteValues } from '@/features/invites/invite-schemas'
import { getSupabaseClient } from '@/lib/supabase'

export function useInviteList(groupId: string, enabled: boolean) {
  return useQuery({
    queryKey: inviteKeys.list(groupId),
    queryFn: () => listInvites(getSupabaseClient(), groupId),
    enabled,
  })
}

export function useInvitePreview(token: string) {
  return useQuery({
    queryKey: ['invite-preview', token],
    queryFn: () => previewInvite(getSupabaseClient(), token),
    enabled: token.length > 0,
  })
}

export function useCreateInvite(groupId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (values: CreateInviteValues) =>
      createInvite(getSupabaseClient(), groupId, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inviteKeys.list(groupId) })
      toast.success('Invite created')
    },
  })
}

export function useRevokeInvite(groupId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (inviteId: string) =>
      revokeInvite(getSupabaseClient(), inviteId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inviteKeys.list(groupId) })
      toast.success('Invite revoked')
    },
  })
}

export function useRedeemInvite(token: string) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: () => redeemInvite(getSupabaseClient(), token),
    onSuccess: (result) => {
      if (user) {
        void queryClient.invalidateQueries({
          queryKey: groupKeys.list(user.id),
        })
        void queryClient.invalidateQueries({
          queryKey: groupKeys.memberLists(user.id),
        })
      }

      void queryClient.invalidateQueries({
        queryKey: groupKeys.detail(result.group_id),
      })
      void queryClient.invalidateQueries({
        queryKey: groupKeys.members(result.group_id),
      })

      toast.success(
        result.already_member
          ? 'You are already a member of this group.'
          : 'You joined the watch group.',
      )
      void navigate(`/groups/${result.group_id}`)
    },
  })
}
