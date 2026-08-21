import { useParams, useSearchParams } from 'react-router'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { useAuth } from '@/features/auth/use-auth'
import { groupRoleForUser } from '@/features/groups/group-schemas'
import { useGroup, useGroupMembers } from '@/features/groups/use-groups'
import {
  formatWatchedFraction,
  groupWatchedFraction,
  progressStatusFor,
} from '@/features/progress/progress-metrics'
import { useGroupProgress, useSetTitleStatus } from '@/features/progress/use-progress'
import {
  averageRating,
  formatAverageRatingLabel,
  ratingsForTitle,
  reviewsForTitle,
} from '@/features/reviews/review-metrics'
import { useGroupReviews } from '@/features/reviews/use-reviews'
import { toFriendlySkipListError } from '@/features/watchlist/skip-errors'
import { toFriendlyTitleListError } from '@/features/watchlist/title-errors'
import {
  filterTitles,
  parseWatchlistFilters,
  serializeWatchlistFilters,
  type WatchlistFilters,
} from '@/features/watchlist/title-filters'
import { groupTitlesByEra } from '@/features/watchlist/title-groups'
import { TitleCard } from '@/features/watchlist/TitleCard'
import { TitleRow } from '@/features/watchlist/TitleRow'
import { TmdbCredit } from '@/features/watchlist/TmdbCredit'
import {
  useGroupSkippedTitles,
  useToggleGroupTitleSkip,
} from '@/features/watchlist/use-skipped-titles'
import { useTitleList } from '@/features/watchlist/use-titles'
import { WatchlistFilters as WatchlistFiltersPanel } from '@/features/watchlist/WatchlistFilters'

function WatchlistSkeleton() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading watchlist</span>
      <Skeleton className="h-10 w-48" />
      <Skeleton className="mt-6 h-24 w-full" />
      <Skeleton className="mt-4 h-32 w-full" />
    </div>
  )
}

export function WatchlistPage() {
  const { groupId = '' } = useParams()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const groupQuery = useGroup(groupId)
  const titlesQuery = useTitleList()
  const progressQuery = useGroupProgress(groupId)
  const reviewsQuery = useGroupReviews(groupId)
  const membersQuery = useGroupMembers(groupId)
  const skippedQuery = useGroupSkippedTitles(groupId)
  const toggleSkip = useToggleGroupTitleSkip(groupId)
  const setStatus = useSetTitleStatus(groupId)
  const filters = parseWatchlistFilters(searchParams)
  const titles = titlesQuery.data ?? []
  const progress = progressQuery.data ?? []
  const reviews = reviewsQuery.data ?? []
  const skippedTitleIds = new Set(
    (skippedQuery.data ?? []).map((row) => row.title_id),
  )
  const memberIds = (membersQuery.data ?? []).map((member) => member.user_id)
  const myProgress = progress
    .filter((row) => row.user_id === user?.id)
    .map((row) => ({ title_id: row.title_id, status: row.status }))
  const visible = filterTitles(titles, myProgress, filters, skippedTitleIds)
  const groups = groupTitlesByEra(visible)
  const isOwner = Boolean(
    groupQuery.data &&
      user &&
      groupRoleForUser(groupQuery.data, user.id) === 'owner',
  )

  function updateFilters(next: WatchlistFilters) {
    setSearchParams(serializeWatchlistFilters(next), { replace: true })
  }

  if (
    titlesQuery.isPending ||
    progressQuery.isPending ||
    reviewsQuery.isPending ||
    skippedQuery.isPending
  ) {
    return <WatchlistSkeleton />
  }

  if (
    titlesQuery.isError ||
    progressQuery.isError ||
    reviewsQuery.isError ||
    skippedQuery.isError
  ) {
    return (
      <ErrorState
        message={
          skippedQuery.isError
            ? toFriendlySkipListError()
            : toFriendlyTitleListError()
        }
        onRetry={() => {
          void titlesQuery.refetch()
          void progressQuery.refetch()
          void reviewsQuery.refetch()
          void skippedQuery.refetch()
        }}
      />
    )
  }

  const query = searchParams.toString()
  const querySuffix = query ? `?${query}` : ''

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl tracking-[0.08em] text-heading uppercase">
          Watchlist
        </h1>
        <p className="text-sm text-muted">
          Shared MCU order for this group. Series and specials are one catalog
          entry each, not per episode.
        </p>
      </header>
      <WatchlistFiltersPanel
        filters={filters}
        matchCount={(candidate: WatchlistFilters) =>
          filterTitles(titles, myProgress, candidate, skippedTitleIds).length
        }
        onChange={updateFilters}
      />
      <p className="text-sm text-secondary">
        Showing {visible.length} of {titles.length} titles
      </p>
      {titles.length === 0 ? (
        <EmptyState
          title="No titles yet"
          description="The MCU catalog has no active titles to show."
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title="No matching titles"
          description="Try a different search or clear the filters."
        />
      ) : (
        <>
          {groups.map((group, index) => (
            <section key={`${group.era}-${String(index)}`} className="space-y-3">
              <h2 className="font-display text-sm tracking-[0.12em] text-accent">
                {group.era}
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2 md:hidden">
                {group.titles.map((title) => {
                  const fraction = groupWatchedFraction(
                    title.id,
                    memberIds,
                    progress,
                  )
                  const titleRatings = ratingsForTitle(reviews, title.id)
                  const titleReviews = reviewsForTitle(reviews, title.id)
                  const skipped = skippedTitleIds.has(title.id)

                  return (
                    <li key={title.id}>
                      <TitleCard
                        title={title}
                        status={progressStatusFor(
                          progress,
                          user?.id ?? '',
                          title.id,
                        )}
                        sort={filters.sort}
                        href={`/groups/${groupId}/titles/${title.id}${querySuffix}`}
                        groupWatchedLabel={formatWatchedFraction(
                          fraction.watched,
                          fraction.total,
                        )}
                        averageRatingLabel={formatAverageRatingLabel(
                          averageRating(titleRatings),
                          titleRatings.length,
                        )}
                        showRating={filters.showRating}
                        showReviews={filters.showReviews}
                        skipped={skipped}
                        canToggleSkip={isOwner}
                        skipDisabled={toggleSkip.isPending}
                        onToggleSkip={(nextSkipped) => {
                          toggleSkip.mutate({
                            titleId: title.id,
                            skipped: nextSkipped,
                          })
                        }}
                        statusDisabled={setStatus.isPending}
                        onStatusChange={(nextStatus) => {
                          setStatus.mutate({
                            titleId: title.id,
                            status: nextStatus,
                          })
                        }}
                        reviews={titleReviews}
                        members={membersQuery.data ?? []}
                        currentUserId={user?.id ?? ''}
                      />
                    </li>
                  )
                })}
              </ul>
              <ul className="hidden space-y-2 md:block">
                {group.titles.map((title) => {
                  const fraction = groupWatchedFraction(
                    title.id,
                    memberIds,
                    progress,
                  )
                  const titleRatings = ratingsForTitle(reviews, title.id)
                  const titleReviews = reviewsForTitle(reviews, title.id)
                  const skipped = skippedTitleIds.has(title.id)

                  return (
                    <li key={title.id}>
                      <TitleRow
                        title={title}
                        status={progressStatusFor(
                          progress,
                          user?.id ?? '',
                          title.id,
                        )}
                        sort={filters.sort}
                        href={`/groups/${groupId}/titles/${title.id}${querySuffix}`}
                        groupWatchedLabel={formatWatchedFraction(
                          fraction.watched,
                          fraction.total,
                        )}
                        averageRatingLabel={formatAverageRatingLabel(
                          averageRating(titleRatings),
                          titleRatings.length,
                        )}
                        showRating={filters.showRating}
                        showReviews={filters.showReviews}
                        skipped={skipped}
                        canToggleSkip={isOwner}
                        skipDisabled={toggleSkip.isPending}
                        onToggleSkip={(nextSkipped) => {
                          toggleSkip.mutate({
                            titleId: title.id,
                            skipped: nextSkipped,
                          })
                        }}
                        statusDisabled={setStatus.isPending}
                        onStatusChange={(nextStatus) => {
                          setStatus.mutate({
                            titleId: title.id,
                            status: nextStatus,
                          })
                        }}
                        reviews={titleReviews}
                        members={membersQuery.data ?? []}
                        currentUserId={user?.id ?? ''}
                      />
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </>
      )}
      <TmdbCredit className="text-xs text-muted" />
    </div>
  )
}
