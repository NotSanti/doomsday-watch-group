import { Plus } from 'lucide-react'
import { useParams, useSearchParams } from 'react-router'
import { DeferredMount } from '@/components/DeferredMount'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SelectField } from '@/components/ui/select'
import { useAuth } from '@/features/auth/use-auth'
import { toFriendlyGroupDetailError, toFriendlyGroupMembersError } from '@/features/groups/group-errors'
import { groupRoleForUser } from '@/features/groups/group-schemas'
import { useGroup, useGroupMembers } from '@/features/groups/use-groups'
import { CreateInviteDialog } from '@/features/invites/CreateInviteDialog'
import { MemberComparisonGrid } from '@/features/members/MemberComparisonGrid'
import { MonthlyWatchTracker } from '@/features/members/MonthlyWatchTracker'
import {
  isMemberSort,
  sortGroupMembers,
  type MemberSort,
} from '@/features/members/member-sort'
import { MemberProgressCard } from '@/features/progress/MemberProgressCard'
import { upcomingTitles, titlesOnGroupPath } from '@/features/progress/progress-metrics'
import type { GroupProgressRow } from '@/features/progress/progress-schemas'
import { useGroupProgress } from '@/features/progress/use-progress'
import { toFriendlyProgressListError } from '@/features/progress/progress-errors'
import { toFriendlyTitleListError } from '@/features/watchlist/title-errors'
import { useGroupSkippedTitles } from '@/features/watchlist/use-skipped-titles'
import { useTitleList } from '@/features/watchlist/use-titles'

function MembersBodySkeleton() {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <span className="sr-only">Loading members</span>
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}

export function MembersPage() {
  const { groupId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const groupQuery = useGroup(groupId)
  const membersQuery = useGroupMembers(groupId)
  const titlesQuery = useTitleList()
  const progressQuery = useGroupProgress(groupId)
  const skippedQuery = useGroupSkippedTitles(groupId)
  const sort = isMemberSort(searchParams.get('sort') ?? '')
    ? (searchParams.get('sort') as MemberSort)
    : 'completion'
  const isOwner = Boolean(
    groupQuery.data &&
      user &&
      groupRoleForUser(groupQuery.data, user.id) === 'owner',
  )

  const corePending =
    membersQuery.isPending ||
    titlesQuery.isPending ||
    progressQuery.isPending ||
    skippedQuery.isPending

  if (groupQuery.isError || (!groupQuery.isPending && !groupQuery.data)) {
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
  const header = (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl tracking-[0.08em] text-heading uppercase">
            Members
          </h1>
          {isOwner && group ? (
            <CreateInviteDialog
              groupId={group.id}
              trigger={
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  aria-label="Add members"
                  className="size-9 shrink-0 px-0"
                >
                  <Plus aria-hidden="true" className="size-5" />
                </Button>
              }
            />
          ) : null}
        </div>
        <p className="mt-2 text-muted">
          Compare progress across the group. The owner is marked on each card.
        </p>
      </div>
      <SelectField
        label="Sort by"
        aria-label="Sort by"
        value={sort}
        disabled={!group || corePending}
        options={[
          { value: 'completion', label: 'Completion' },
          { value: 'recent', label: 'Recently active' },
          { value: 'name', label: 'Name' },
        ]}
        onValueChange={(value) => {
          if (isMemberSort(value)) {
            const next = new URLSearchParams(searchParams)
            if (value === 'completion') {
              next.delete('sort')
            } else {
              next.set('sort', value)
            }
            setSearchParams(next, { replace: true })
          }
        }}
      />
    </header>
  )

  if (!group || corePending) {
    return (
      <div className="space-y-8">
        {header}
        <MembersBodySkeleton />
      </div>
    )
  }

  if (titlesQuery.isError) {
    return (
      <div className="space-y-8">
        {header}
        <ErrorState
          message={toFriendlyTitleListError()}
          onRetry={() => {
            void titlesQuery.refetch()
          }}
        />
      </div>
    )
  }

  if (progressQuery.isError) {
    return (
      <div className="space-y-8">
        {header}
        <ErrorState
          message={toFriendlyProgressListError()}
          onRetry={() => {
            void progressQuery.refetch()
          }}
        />
      </div>
    )
  }

  if (skippedQuery.isError) {
    return (
      <div className="space-y-8">
        {header}
        <ErrorState
          message={toFriendlyTitleListError()}
          onRetry={() => {
            void skippedQuery.refetch()
          }}
        />
      </div>
    )
  }

  const titles = titlesQuery.data ?? []
  const progress = progressQuery.data ?? []
  const progressByUser = new Map<string, GroupProgressRow[]>()
  for (const row of progress) {
    const existing = progressByUser.get(row.user_id)
    if (existing) {
      existing.push(row)
    } else {
      progressByUser.set(row.user_id, [row])
    }
  }
  const skippedTitleIds = new Set(
    (skippedQuery.data ?? []).map((row) => row.title_id),
  )
  const pathTitles = titlesOnGroupPath(titles, skippedTitleIds)
  const members = membersQuery.data ?? []
  const sorted = sortGroupMembers(
    members,
    titles,
    progress,
    sort,
    skippedTitleIds,
  )
  const comparisonTitles = [
    ...(group.current_title_id
      ? titles.filter((title) => title.id === group.current_title_id)
      : []),
    ...upcomingTitles(titles, group.current_title_id, 3, skippedTitleIds),
  ].filter(
    (title, index, list) =>
      list.findIndex((item) => item.id === title.id) === index,
  )

  return (
    <div className="min-w-0 space-y-8">
      {header}

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
          description={
            isOwner
              ? 'Create an invite link to bring friends into this group.'
              : 'Invite friends from group settings to start comparing progress.'
          }
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
                    titles={pathTitles}
                    progress={progress}
                    currentTitleId={group.current_title_id}
                  />
                </div>
              </li>
            ))}
          </ul>
          <section className="min-w-0 space-y-3">
            <h2 className="font-display text-2xl tracking-[0.08em] text-heading uppercase">
              Progress
            </h2>
            <TooltipProvider delayDuration={200}>
              <ul className="grid min-w-0 gap-3">
                {sorted.map((member, index) => (
                  <li
                    key={`progress:${member.group_id}:${member.user_id}`}
                    className="min-w-0"
                  >
                    <DeferredMount className="min-w-0" eager={index === 0}>
                      <MonthlyWatchTracker
                        member={member}
                        progress={progressByUser.get(member.user_id) ?? []}
                        timeZone={group.timezone}
                      />
                    </DeferredMount>
                  </li>
                ))}
              </ul>
            </TooltipProvider>
          </section>
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
