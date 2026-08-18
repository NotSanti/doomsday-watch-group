import { useParams } from 'react-router'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/features/auth/use-auth'
import { toFriendlyGroupDetailError } from '@/features/groups/group-errors'
import { groupRoleForUser } from '@/features/groups/group-schemas'
import { MemberRoster } from '@/features/groups/MemberRoster'
import { useGroup, useGroupMembers } from '@/features/groups/use-groups'

function formatTargetDate(iso: string, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      dateStyle: 'medium',
      timeZone,
    }).format(new Date(iso))
  } catch {
    return new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium' }).format(
      new Date(iso),
    )
  }
}

export function GroupDashboardPage() {
  const { groupId = '' } = useParams()
  const { user } = useAuth()
  const groupQuery = useGroup(groupId)
  const membersQuery = useGroupMembers(groupId)

  if (groupQuery.isPending) {
    return (
      <div role="status" aria-live="polite">
        <span className="sr-only">Loading group</span>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-4 h-24 w-full" />
      </div>
    )
  }

  if (groupQuery.isError || !groupQuery.data) {
    return (
      <ErrorState
        message={toFriendlyGroupDetailError()}
        onRetry={() => {
          void groupQuery.refetch()
        }}
      />
    )
  }

  const group = groupQuery.data
  const role = groupRoleForUser(group, user?.id ?? '')

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl tracking-[0.08em] text-heading uppercase">
            {group.name}
          </h1>
          <Badge tone={role === 'owner' ? 'watched' : 'muted'}>
            {role === 'owner' ? 'Owner' : 'Member'}
          </Badge>
        </div>
        {group.description ? (
          <p className="max-w-2xl text-muted">{group.description}</p>
        ) : null}
        <p className="text-sm text-secondary">
          Doomsday target {formatTargetDate(group.target_date, group.timezone)}{' '}
          ({group.timezone})
        </p>
      </header>
      <section className="space-y-3">
        <h2 className="font-display text-2xl tracking-[0.08em] text-heading uppercase">
          Members
        </h2>
        <MemberRoster
          members={membersQuery.data ?? []}
          isPending={membersQuery.isLoading}
          isError={membersQuery.isError}
          onRetry={() => {
            void membersQuery.refetch()
          }}
        />
      </section>
      <EmptyState
        title="Up next"
        description="Current title, progress, activity, and standings will appear here."
      />
    </div>
  )
}
