import { Link, Outlet, useParams } from 'react-router'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { Button } from '@/components/ui/button'
import { toFriendlyGroupDetailError } from '@/features/groups/group-errors'
import { isGroupId } from '@/features/groups/group-schemas'
import { useGroup } from '@/features/groups/use-groups'

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
          <Link to="/app">Back to your groups</Link>
        </Button>
      }
    />
  )
}

export function RequireGroupMembership() {
  const { groupId = '' } = useParams()
  const groupQuery = useGroup(groupId)
  const canFetch = isGroupId(groupId)

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
