import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  DEFAULT_WATCHLIST_FILTERS,
  isWatchlistImportanceFilter,
  isWatchlistSort,
  isWatchlistStatusFilter,
  isWatchlistTypeFilter,
  type WatchlistFilters,
} from '@/features/watchlist/title-filters'

const selectClassName = cn(
  'h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-heading',
  'hover:border-border-strong focus-visible:outline-none',
)

type WatchlistFiltersProps = {
  filters: WatchlistFilters
  onChange: (filters: WatchlistFilters) => void
}

export function WatchlistFiltersForm({
  filters,
  onChange,
}: WatchlistFiltersProps) {
  return (
    <form
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="sm:col-span-2 lg:col-span-1">
        <label className="mb-1 block text-sm text-secondary" htmlFor="watchlist-search">
          Search
        </label>
        <Input
          id="watchlist-search"
          value={filters.q}
          placeholder="Title name"
          onChange={(event) =>
            onChange({ ...filters, q: event.target.value })
          }
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-secondary" htmlFor="watchlist-type">
          Type
        </label>
        <select
          id="watchlist-type"
          className={selectClassName}
          value={filters.type}
          onChange={(event) => {
            if (isWatchlistTypeFilter(event.target.value)) {
              onChange({ ...filters, type: event.target.value })
            }
          }}
        >
          <option value="all">All types</option>
          <option value="movie">Movies</option>
          <option value="series">Series</option>
          <option value="special">Specials</option>
        </select>
      </div>
      <div>
        <label
          className="mb-1 block text-sm text-secondary"
          htmlFor="watchlist-importance"
        >
          Importance
        </label>
        <select
          id="watchlist-importance"
          className={selectClassName}
          value={filters.importance}
          onChange={(event) => {
            if (isWatchlistImportanceFilter(event.target.value)) {
              onChange({ ...filters, importance: event.target.value })
            }
          }}
        >
          <option value="all">All importance</option>
          <option value="essential">Essential</option>
          <option value="recommended">Recommended</option>
          <option value="optional">Optional</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm text-secondary" htmlFor="watchlist-status">
          My status
        </label>
        <select
          id="watchlist-status"
          className={selectClassName}
          value={filters.status}
          onChange={(event) => {
            if (isWatchlistStatusFilter(event.target.value)) {
              onChange({ ...filters, status: event.target.value })
            }
          }}
        >
          <option value="all">All statuses</option>
          <option value="unwatched">Unwatched</option>
          <option value="watching">Watching</option>
          <option value="watched">Watched</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm text-secondary" htmlFor="watchlist-sort">
          Order
        </label>
        <select
          id="watchlist-sort"
          className={selectClassName}
          value={filters.sort}
          onChange={(event) => {
            if (isWatchlistSort(event.target.value)) {
              onChange({ ...filters, sort: event.target.value })
            }
          }}
        >
          <option value="doomsday">Doomsday order</option>
          <option value="release">Release order</option>
        </select>
      </div>
      {filters.q ||
      filters.type !== DEFAULT_WATCHLIST_FILTERS.type ||
      filters.importance !== DEFAULT_WATCHLIST_FILTERS.importance ||
      filters.status !== DEFAULT_WATCHLIST_FILTERS.status ||
      filters.sort !== DEFAULT_WATCHLIST_FILTERS.sort ? (
        <div className="sm:col-span-2 lg:col-span-5">
          <button
            type="button"
            className="text-sm text-heading underline decoration-border-strong underline-offset-2 hover:text-primary-emphasis"
            onClick={() => onChange(DEFAULT_WATCHLIST_FILTERS)}
          >
            Clear filters
          </button>
        </div>
      ) : null}
    </form>
  )
}
