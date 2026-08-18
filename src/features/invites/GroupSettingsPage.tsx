import { EmptyState } from '@/components/EmptyState'
import { Skeleton } from '@/components/Skeleton'
import { useAuth } from '@/features/auth/use-auth'
import { groupRoleForUser } from '@/features/groups/group-schemas'
import { useGroup } from '@/features/groups/use-groups'
import { InviteManager } from '@/features/invites/InviteManager'
import { useParams } from 'react-router'

export function GroupSettingsPage() {
  const { groupId = '' } = useParams()
  const { user } = useAuth()
  const groupQuery = useGroup(groupId)
  const group = groupQuery.data
  const isOwner = Boolean(
    group && user && groupRoleForUser(group, user.id) === 'owner',
  )

  if (groupQuery.isPending) {
    return (
      <div role="status" aria-live="polite">
        <span className="sr-only">Loading settings</span>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-6 h-40 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl tracking-[0.08em] text-heading uppercase">
          Group settings
        </h1>
        <p className="mt-2 text-muted">
          Invite links are owner-only. Other group controls land in a later
          milestone.
        </p>
      </header>
      {isOwner && group ? (
        <InviteManager groupId={group.id} />
      ) : (
        <EmptyState
          title="Owner only"
          description="Only the group owner can create, copy, and revoke invites."
        />
      )}
    </div>
  )
}
