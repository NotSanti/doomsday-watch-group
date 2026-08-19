import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { Countdown } from '@/components/Countdown'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/use-auth'
import { ActivityFeed } from '@/features/activity/ActivityFeed'
import { useGroupActivity } from '@/features/activity/use-activity'
import { toFriendlyGroupDetailError, toFriendlyGroupMembersError } from '@/features/groups/group-errors'
import { groupRoleForUser } from '@/features/groups/group-schemas'
import { MemberRoster } from '@/features/groups/MemberRoster'
import { useGroup, useGroupMembers, useSetCurrentTitle } from '@/features/groups/use-groups'
import { ChangeCurrentTitleDialog } from '@/features/progress/ChangeCurrentTitleDialog'
import { CurrentTitleHero } from '@/features/progress/CurrentTitleHero'
import { MemberProgressCard } from '@/features/progress/MemberProgressCard'
import { MetricCard } from '@/features/progress/MetricCard'
import {
  averageCompletionPercent,
  currentTitleCompletionPercent,
  formatPercent,
  formatWatchedFraction,
  groupWatchedFraction,
  progressStatusFor,
  titlesCompletedAsAGroup,
  upcomingTitles,
} from '@/features/progress/progress-metrics'
import { useGroupProgress, useSetTitleStatus } from '@/features/progress/use-progress'
import { toFriendlyProgressListError } from '@/features/progress/progress-errors'
import { TitleArtwork } from '@/features/watchlist/TitleArtwork'
import {
  MEDIA_TYPE_LABEL,
  sequenceForTitle,
  titleRuntimeLabel,
  titleYear,
} from '@/features/watchlist/title-schemas'
import { useTitleList } from '@/features/watchlist/use-titles'
import { toFriendlyTitleListError } from '@/features/watchlist/title-errors'
import { formatDateInTimeZone } from '@/lib/timezone'

export function GroupDashboardPage() {
  const { groupId = '' } = useParams()
  const { user } = useAuth()
  const groupQuery = useGroup(groupId)
  const membersQuery = useGroupMembers(groupId)
  const titlesQuery = useTitleList()
  const progressQuery = useGroupProgress(groupId)
  const activityQuery = useGroupActivity(groupId)
  const setStatus = useSetTitleStatus(groupId)
  const setCurrentTitle = useSetCurrentTitle(groupId)
  const [pickerOpen, setPickerOpen] = useState(false)

  const pending =
    groupQuery.isPending ||
    membersQuery.isPending ||
    titlesQuery.isPending ||
    progressQuery.isPending ||
    activityQuery.isPending

  if (pending) {
    return (
      <div role="status" aria-live="polite">
        <span className="sr-only">Loading group</span>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-4 h-24 w-full" />
        <Skeleton className="mt-4 h-40 w-full" />
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
  const role = groupRoleForUser(group, user?.id ?? '')
  const titles = titlesQuery.data ?? []
  const members = membersQuery.data ?? []
  const progress = progressQuery.data ?? []
  const memberIds = members.map((member) => member.user_id)
  const activeTitleIds = titles.map((title) => title.id)
  const activeIdSet = new Set(activeTitleIds)
  const currentTitle =
    titles.find((title) => title.id === group.current_title_id) ?? null
  const completedAsGroup = titlesCompletedAsAGroup(
    activeTitleIds,
    memberIds,
    progress,
  )
  const averageCompletion = averageCompletionPercent(
    memberIds,
    titles.length,
    progress,
    activeIdSet,
  )
  const currentCompletion = currentTitleCompletionPercent(
    group.current_title_id,
    memberIds,
    progress,
  )
  const upcoming = upcomingTitles(titles, group.current_title_id)
  const currentFraction = currentTitle
    ? groupWatchedFraction(currentTitle.id, memberIds, progress)
    : null

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
          Doomsday target {formatDateInTimeZone(group.target_date, group.timezone)}{' '}
          ({group.timezone})
        </p>
        <Countdown targetIso={group.target_date} className="justify-start" />
      </header>

      <section className="space-y-3">
        <h2 className="font-display text-2xl tracking-[0.08em] text-heading uppercase">
          Now watching
        </h2>
        {currentTitle && currentFraction ? (
          <CurrentTitleHero
            groupId={group.id}
            title={currentTitle}
            status={progressStatusFor(
              progress,
              user?.id ?? '',
              currentTitle.id,
            )}
            groupWatchedLabel={formatWatchedFraction(
              currentFraction.watched,
              currentFraction.total,
            )}
            isOwner={role === 'owner'}
            statusDisabled={setStatus.isPending}
            onStatusChange={(status) => {
              setStatus.mutate({ titleId: currentTitle.id, status })
            }}
            onChangeCurrentTitle={() => {
              setPickerOpen(true)
            }}
          />
        ) : (
          <EmptyState
            title="No current title"
            description="The owner can pick what the group is watching together."
            action={
              role === 'owner' ? (
                <Button
                  onClick={() => {
                    setPickerOpen(true)
                  }}
                >
                  Choose current title
                </Button>
              ) : undefined
            }
          />
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          label="Completed as a group"
          value={`${String(completedAsGroup)} of ${String(titles.length)}`}
          description="Titles where every active member has status Watched."
        />
        <MetricCard
          label="Average completion"
          value={formatPercent(averageCompletion)}
          description="Average of each active member’s watched-title percentage."
        />
        <MetricCard
          label="Current title"
          value={
            currentCompletion === null
              ? 'Not set'
              : formatPercent(currentCompletion)
          }
          description="Share of active members who have watched the current title."
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl tracking-[0.08em] text-heading uppercase">
          Upcoming
        </h2>
        {upcoming.length === 0 ? (
          <EmptyState
            title="No upcoming titles"
            description="The Doomsday path has no further titles after the current pick."
          />
        ) : (
          <ul className="grid gap-3 md:grid-cols-3">
            {upcoming.map((title) => {
              const year = titleYear(title.release_date)
              const runtime = titleRuntimeLabel(title)
              const sequence = sequenceForTitle(title, 'doomsday')

              return (
                <li key={title.id}>
                  <Link
                    to={`/groups/${group.id}/titles/${title.id}`}
                    className="elevated-card block rounded-xl p-3 hover:border-primary-emphasis/40"
                  >
                    <TitleArtwork
                      path={title.poster_path}
                      alt=""
                      className="rounded-lg"
                    />
                    <p className="mt-3 text-xs tracking-[0.14em] text-secondary uppercase">
                      {String(sequence).padStart(2, '0')}
                    </p>
                    <p className="font-display text-lg tracking-[0.06em] text-heading uppercase">
                      {title.name}
                    </p>
                    <p className="text-sm text-muted">
                      {[year, MEDIA_TYPE_LABEL[title.media_type], runtime]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl tracking-[0.08em] text-heading uppercase">
          Member progress
        </h2>
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
            description="Invite friends to start comparing progress."
          />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {members.map((member) => (
              <li key={`${member.group_id}:${member.user_id}`}>
                <MemberProgressCard
                  member={member}
                  titles={titles}
                  progress={progress}
                  currentTitleId={group.current_title_id}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl tracking-[0.08em] text-heading uppercase">
          Members
        </h2>
        <MemberRoster
          members={members}
          isPending={false}
          isError={membersQuery.isError}
          onRetry={() => {
            void membersQuery.refetch()
          }}
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl tracking-[0.08em] text-heading uppercase">
          Activity
        </h2>
        <ActivityFeed
          events={activityQuery.data ?? []}
          timeZone={group.timezone}
          isPending={false}
          isError={activityQuery.isError}
          onRetry={() => {
            void activityQuery.refetch()
          }}
        />
      </section>

      {role === 'owner' ? (
        <ChangeCurrentTitleDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          titles={titles}
          currentTitleId={group.current_title_id}
          isPending={setCurrentTitle.isPending}
          onSave={(titleId) => setCurrentTitle.mutateAsync(titleId)}
        />
      ) : null}
    </div>
  )
}
