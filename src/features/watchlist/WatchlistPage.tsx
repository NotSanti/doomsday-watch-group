import { useParams, useSearchParams } from 'react-router'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { toFriendlyTitleListError } from '@/features/watchlist/title-errors'
import {
  filterTitles,
  parseWatchlistFilters,
  serializeWatchlistFilters,
  statusForTitle,
  type WatchlistFilters,
} from '@/features/watchlist/title-filters'
import { TitleCard } from '@/features/watchlist/TitleCard'
import { TitleRow } from '@/features/watchlist/TitleRow'
import { TmdbCredit } from '@/features/watchlist/TmdbCredit'
import {
  useMyTitleProgress,
  useTitleList,
} from '@/features/watchlist/use-titles'
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
  const [searchParams, setSearchParams] = useSearchParams()
  const titlesQuery = useTitleList()
  const progressQuery = useMyTitleProgress(groupId)
  const filters = parseWatchlistFilters(searchParams)
  const titles = titlesQuery.data ?? []
  const progress = progressQuery.data ?? []
  const visible = filterTitles(titles, progress, filters)

  function updateFilters(next: WatchlistFilters) {
    setSearchParams(serializeWatchlistFilters(next), { replace: true })
  }

  if (titlesQuery.isPending || progressQuery.isPending) {
    return <WatchlistSkeleton />
  }

  if (titlesQuery.isError || progressQuery.isError) {
    return (
      <ErrorState
        message={toFriendlyTitleListError()}
        onRetry={() => {
          void titlesQuery.refetch()
          void progressQuery.refetch()
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
          <ul className="grid gap-3 sm:grid-cols-2 md:hidden">
            {visible.map((title) => (
              <li key={title.id}>
                <TitleCard
                  title={title}
                  status={statusForTitle(title.id, progress)}
                  sort={filters.sort}
                  href={`/groups/${groupId}/titles/${title.id}${querySuffix}`}
                />
              </li>
            ))}
          </ul>
          <ul className="hidden space-y-2 md:block">
            {visible.map((title) => (
              <li key={title.id}>
                <TitleRow
                  title={title}
                  status={statusForTitle(title.id, progress)}
                  sort={filters.sort}
                  href={`/groups/${groupId}/titles/${title.id}${querySuffix}`}
                />
              </li>
            ))}
          </ul>
        </>
      )}
      <TmdbCredit className="text-xs text-muted" />
    </div>
  )
}
