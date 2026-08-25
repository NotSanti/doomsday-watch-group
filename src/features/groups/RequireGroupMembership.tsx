import { Link, Outlet, useParams } from 'react-router'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/use-auth'
import { toFriendlyGroupDetailError } from '@/features/groups/group-errors'
import { isGroupId } from '@/features/groups/group-schemas'
import { GROUPS_LIST_NAV_STATE } from '@/features/groups/home-group'
import { useGroup } from '@/features/groups/use-groups'
import { useActiveGroupRealtime } from '@/features/realtime/use-active-group-realtime'

function MembershipSkeleton() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Checking group membership</span>
      <Skeleton className="h-10 w-64" />
      <Skeleton className="mt-6 h-40 w-full" />
    </div>
  )
}

function GroupUnavailable() {
  return (
    <EmptyState
      title="Group not available"
      description="This group does not exist or you are not a member."
      action={
        <Button asChild>
          <Link to="/app" state={GROUPS_LIST_NAV_STATE}>
            Back to your groups
          </Link>
        </Button>
      }
    />
  )
}

export function RequireGroupMembership() {
  const { groupId = '' } = useParams()
  const { user } = useAuth()
  const groupQuery = useGroup(groupId)
  const canFetch = isGroupId(groupId)
  useActiveGroupRealtime(
    canFetch && groupQuery.data ? groupId : '',
    user?.id,
  )

  if (!canFetch) {
    return <GroupUnavailable />
  }

  if (groupQuery.isPending) {
    return <MembershipSkeleton />
  }

  if (groupQuery.isError) {
    return (
      <ErrorState
        message={toFriendlyGroupDetailError()}
        onRetry={() => {
          void groupQuery.refetch()
        }}
      />
    )
  }

  if (!groupQuery.data) {
    return <GroupUnavailable />
  }

  return <Outlet />
}
