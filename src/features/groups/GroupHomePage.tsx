import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/features/auth/use-auth'
import { CreateGroupDialog } from '@/features/groups/CreateGroupDialog'
import { HomeGroupButton } from '@/features/groups/HomeGroupButton'
import { toFriendlyGroupListError } from '@/features/groups/group-errors'
import { groupRoleForUser } from '@/features/groups/group-schemas'
import { isGroupsListNavState } from '@/features/groups/home-group'
import { MemberRoster } from '@/features/groups/MemberRoster'
import { useHomeGroupPreference } from '@/features/groups/use-home-group'
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
  const location = useLocation()
  const navigate = useNavigate()
  const groupsQuery = useGroupList()
  const groups = groupsQuery.data ?? []
  const userId = user?.id ?? ''
  const membersQuery = useGroupMemberLists(groups.map((group) => group.id))
  const fromNav = isGroupsListNavState(location.state)
  const { homeGroupId, setHomeGroup } = useHomeGroupPreference(
    userId,
    groups.map((group) => group.id),
    { autoSelectSingle: !fromNav },
  )
  const shouldOpenHome =
    !fromNav &&
    !groupsQuery.isPending &&
    !groupsQuery.isError &&
    homeGroupId !== null

  useEffect(() => {
    if (!shouldOpenHome || !homeGroupId) {
      return
    }

    void navigate(`/groups/${homeGroupId}`, { replace: true })
  }, [homeGroupId, navigate, shouldOpenHome])

  if (groupsQuery.isPending || shouldOpenHome) {
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
          const isHome = homeGroupId === group.id

          return (
            <li key={group.id} className="h-full">
              <Card className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle>{group.name}</CardTitle>
                  <div className="flex shrink-0 items-center gap-2">
                    <HomeGroupButton
                      active={isHome}
                      groupName={group.name}
                      onToggle={() => {
                        setHomeGroup(group.id)
                      }}
                    />
                    <Badge tone={role === 'owner' ? 'watched' : 'muted'}>
                      {role === 'owner' ? 'Owner' : 'Member'}
                    </Badge>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 min-h-10 text-sm text-muted">
                  {group.description?.trim() ? group.description : '\u00a0'}
                </p>
                <div className="mt-4">
                  <p className="text-xs tracking-[0.14em] text-secondary uppercase">
                    Members
                  </p>
                  <div className="mt-2">
                    <MemberRoster
                      compact
                      labeled
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
                <div className="mt-auto pt-6">
                  <Button asChild variant="secondary">
                    <Link to={`/groups/${group.id}`}>Open group</Link>
                  </Button>
                </div>
              </Card>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
