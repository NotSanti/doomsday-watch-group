import { useParams, useSearchParams } from 'react-router'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { Badge } from '@/components/ui/badge'
import { toFriendlyGroupDetailError, toFriendlyGroupMembersError } from '@/features/groups/group-errors'
import { useGroup, useGroupMembers } from '@/features/groups/use-groups'
import { MemberComparisonGrid } from '@/features/members/MemberComparisonGrid'
import {
  isMemberSort,
  sortGroupMembers,
  type MemberSort,
} from '@/features/members/member-sort'
import { MemberProgressCard } from '@/features/progress/MemberProgressCard'
import { upcomingTitles } from '@/features/progress/progress-metrics'
import { useGroupProgress } from '@/features/progress/use-progress'
import { toFriendlyProgressListError } from '@/features/progress/progress-errors'
import { toFriendlyTitleListError } from '@/features/watchlist/title-errors'
import { useTitleList } from '@/features/watchlist/use-titles'
import { cn } from '@/lib/utils'

const selectClassName = cn(
  'h-11 rounded-md border border-border bg-surface px-3 text-sm text-heading',
  'hover:border-border-strong focus-visible:outline-none',
)

export function MembersPage() {
  const { groupId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const groupQuery = useGroup(groupId)
  const membersQuery = useGroupMembers(groupId)
  const titlesQuery = useTitleList()
  const progressQuery = useGroupProgress(groupId)
  const sort = isMemberSort(searchParams.get('sort') ?? '')
    ? (searchParams.get('sort') as MemberSort)
    : 'completion'

  const pending =
    groupQuery.isPending ||
    membersQuery.isPending ||
    titlesQuery.isPending ||
    progressQuery.isPending

  if (pending) {
    return (
      <div role="status" aria-live="polite">
        <span className="sr-only">Loading members</span>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-6 h-32 w-full" />
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

  if (titlesQuery.isError) {
    return (
      <ErrorState
        message={toFriendlyTitleListError()}
        onRetry={() => {
          void titlesQuery.refetch()
        }}
      />
    )
  }

  if (progressQuery.isError) {
    return (
      <ErrorState
        message={toFriendlyProgressListError()}
        onRetry={() => {
          void progressQuery.refetch()
        }}
      />
    )
  }

  const group = groupQuery.data
  const titles = titlesQuery.data ?? []
  const progress = progressQuery.data ?? []
  const members = membersQuery.data ?? []
  const sorted = sortGroupMembers(members, titles, progress, sort)
  const comparisonTitles = [
    ...(group.current_title_id
      ? titles.filter((title) => title.id === group.current_title_id)
      : []),
    ...upcomingTitles(titles, group.current_title_id),
  ].filter(
    (title, index, list) =>
      list.findIndex((item) => item.id === title.id) === index,
  )

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-[0.08em] text-heading uppercase">
            Members
          </h1>
          <p className="mt-2 text-muted">
            Compare progress across the group. The owner is marked on each card.
          </p>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm text-secondary">Sort by</span>
          <select
            className={selectClassName}
            aria-label="Sort by"
            value={sort}
            onChange={(event) => {
              if (isMemberSort(event.target.value)) {
                const next = new URLSearchParams(searchParams)
                if (event.target.value === 'completion') {
                  next.delete('sort')
                } else {
                  next.set('sort', event.target.value)
                }
                setSearchParams(next, { replace: true })
              }
            }}
          >
            <option value="completion">Completion</option>
            <option value="recent">Recently active</option>
            <option value="name">Name</option>
          </select>
        </label>
      </header>

      {membersQuery.isError ? (
        <ErrorState
          message={toFriendlyGroupMembersError()}
          onRetry={() => {
            void membersQuery.refetch()
          }}
        />
      ) : members.length === 0 ? (
        <EmptyState
          title="No members yet"
          description="Invite friends from group settings to start comparing progress."
        />
      ) : (
        <>
          <ul className="grid gap-3 md:grid-cols-2">
            {sorted.map((member) => (
              <li key={`${member.group_id}:${member.user_id}`}>
                <div className="relative">
                  {member.role === 'owner' ? (
                    <Badge className="absolute top-3 right-3" tone="watched">
                      Owner
                    </Badge>
                  ) : null}
                  <MemberProgressCard
                    member={member}
                    titles={titles}
                    progress={progress}
                    currentTitleId={group.current_title_id}
                  />
                </div>
              </li>
            ))}
          </ul>
          <section className="space-y-3">
            <h2 className="font-display text-2xl tracking-[0.08em] text-heading uppercase">
              Next titles
            </h2>
            <MemberComparisonGrid
              members={sorted}
              titles={comparisonTitles}
              progress={progress}
            />
          </section>
        </>
      )}
    </div>
  )
}
