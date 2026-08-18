import { Link } from 'react-router'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/features/auth/use-auth'
import { CreateGroupDialog } from '@/features/groups/CreateGroupDialog'
import { toFriendlyGroupListError } from '@/features/groups/group-errors'
import { groupRoleForUser } from '@/features/groups/group-schemas'
import { MemberRoster } from '@/features/groups/MemberRoster'
import { useGroupList, useGroupMemberLists } from '@/features/groups/use-groups'

function GroupsSkeleton() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading your groups</span>
      <Skeleton className="h-10 w-48" />
      <Skeleton className="mt-6 h-32 w-full" />
      <Skeleton className="mt-4 h-32 w-full" />
    </div>
  )
}

export function GroupHomePage() {
  const { user } = useAuth()
  const groupsQuery = useGroupList()
  const groups = groupsQuery.data ?? []
  const userId = user?.id ?? ''
  const membersQuery = useGroupMemberLists(groups.map((group) => group.id))

  if (groupsQuery.isPending) {
    return <GroupsSkeleton />
  }

  if (groupsQuery.isError) {
    return (
      <ErrorState
        message={toFriendlyGroupListError()}
        onRetry={() => {
          void groupsQuery.refetch()
        }}
      />
    )
  }

  if (groups.length === 0) {
    return (
      <EmptyState
        title="Your groups"
        description="Create a private watch group. You will be the owner, and other members can join later with an invite."
        action={<CreateGroupDialog />}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-[0.08em] text-heading uppercase">
            Your groups
          </h1>
          <p className="mt-2 text-muted">
            Switch into a group to open its private dashboard.
          </p>
        </div>
        <CreateGroupDialog />
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {groups.map((group) => {
          const role = groupRoleForUser(group, userId)

          return (
            <li key={group.id}>
              <Card className="h-full">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle>{group.name}</CardTitle>
                  <Badge tone={role === 'owner' ? 'watched' : 'muted'}>
                    {role === 'owner' ? 'Owner' : 'Member'}
                  </Badge>
                </div>
                {group.description ? (
                  <p className="mt-3 text-sm text-muted">{group.description}</p>
                ) : null}
                <div className="mt-4">
                  <p className="text-center text-xs tracking-[0.14em] text-secondary uppercase">
                    Members
                  </p>
                  <div className="mt-2 flex justify-center">
                    <MemberRoster
                      compact
                      members={
                        membersQuery.data?.filter(
                          (member) => member.group_id === group.id,
                        ) ?? []
                      }
                      isPending={membersQuery.isLoading}
                      isError={membersQuery.isError}
                      onRetry={() => {
                        void membersQuery.refetch()
                      }}
                    />
                  </div>
                </div>
                <Button asChild className="mt-6" variant="secondary">
                  <Link to={`/groups/${group.id}`}>Open group</Link>
                </Button>
              </Card>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
