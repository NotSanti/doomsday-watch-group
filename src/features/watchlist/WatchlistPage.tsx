import { useParams, useSearchParams } from 'react-router'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { useAuth } from '@/features/auth/use-auth'
import { useGroupMembers } from '@/features/groups/use-groups'
import {
  formatWatchedFraction,
  groupWatchedFraction,
  progressStatusFor,
} from '@/features/progress/progress-metrics'
import { useGroupProgress } from '@/features/progress/use-progress'
import {
  averageRating,
  formatAverageRatingLabel,
  ratingsForTitle,
} from '@/features/reviews/review-metrics'
import { useGroupReviews } from '@/features/reviews/use-reviews'
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
import { useTitleList } from '@/features/watchlist/use-titles'
import { WatchlistFiltersForm } from '@/features/watchlist/WatchlistFilters'

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
  const titlesQuery = useTitleList()
  const progressQuery = useGroupProgress(groupId)
  const reviewsQuery = useGroupReviews(groupId)
  const membersQuery = useGroupMembers(groupId)
  const filters = parseWatchlistFilters(searchParams)
  const titles = titlesQuery.data ?? []
  const progress = progressQuery.data ?? []
  const reviews = reviewsQuery.data ?? []
  const memberIds = (membersQuery.data ?? []).map((member) => member.user_id)
  const myProgress = progress
    .filter((row) => row.user_id === user?.id)
    .map((row) => ({ title_id: row.title_id, status: row.status }))
  const visible = filterTitles(titles, myProgress, filters)
  const groups = groupTitlesByEra(visible)

  function updateFilters(next: WatchlistFilters) {
    setSearchParams(serializeWatchlistFilters(next), { replace: true })
  }

  if (titlesQuery.isPending || progressQuery.isPending || reviewsQuery.isPending) {
    return <WatchlistSkeleton />
  }

  if (titlesQuery.isError || progressQuery.isError || reviewsQuery.isError) {
    return (
      <ErrorState
        message={toFriendlyTitleListError()}
        onRetry={() => {
          void titlesQuery.refetch()
          void progressQuery.refetch()
          void reviewsQuery.refetch()
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
      <WatchlistFiltersForm filters={filters} onChange={updateFilters} />
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
