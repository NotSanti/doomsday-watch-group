import { SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { chipClasses, type ChipTone } from '@/lib/chip-styles'
import { cn } from '@/lib/utils'
import {
  countActiveWatchlistFilters,
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
  matchCount: (filters: WatchlistFilters) => number
}

function FilterCheckButton({
  id,
  label,
  tone,
  checked,
  onChange,
}: {
  id: string
  label: string
  tone: ChipTone
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'cursor-pointer rounded-full px-3 py-1.5 text-sm transition-colors duration-200',
        checked
          ? chipClasses(tone, 'pill')
          : cn(
              chipClasses('metal', 'pill'),
              'hover:border-chip-metal-fg hover:text-chip-metal-fg',
            ),
      )}
    >
      <input
        id={id}
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(event) => {
          onChange(event.target.checked)
        }}
      />
      {label}
    </label>
  )
}

function WatchlistFiltersFields({
  filters,
  onChange,
  idPrefix = '',
  layout = 'stack',
  showClearLink = false,
}: {
  filters: WatchlistFilters
  onChange: (filters: WatchlistFilters) => void
  idPrefix?: string
  layout?: 'stack' | 'desktop'
  showClearLink?: boolean
}) {
  const searchId = `${idPrefix}watchlist-search`
  const typeId = `${idPrefix}watchlist-type`
  const importanceId = `${idPrefix}watchlist-importance`
  const statusId = `${idPrefix}watchlist-status`
  const sortId = `${idPrefix}watchlist-sort`
  const showRatingId = `${idPrefix}watchlist-show-rating`
  const showReviewsId = `${idPrefix}watchlist-show-reviews`
  const isDesktop = layout === 'desktop'

  return (
    <div
      className={cn(
        'grid gap-3',
        isDesktop ? 'md:grid-cols-2 lg:grid-cols-5' : 'grid-cols-1',
      )}
    >
      <div className={cn(isDesktop && 'md:col-span-2 lg:col-span-1')}>
        <label className="mb-1 block text-sm text-secondary" htmlFor={searchId}>
          Search
        </label>
        <Input
          id={searchId}
          value={filters.q}
          placeholder="Title name"
          onChange={(event) => onChange({ ...filters, q: event.target.value })}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-secondary" htmlFor={typeId}>
          Type
        </label>
        <select
          id={typeId}
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
          htmlFor={importanceId}
        >
          Importance
        </label>
        <select
          id={importanceId}
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
        <label className="mb-1 block text-sm text-secondary" htmlFor={statusId}>
          My status
        </label>
        <select
          id={statusId}
          className={selectClassName}
          value={filters.status}
          onChange={(event) => {
            if (isWatchlistStatusFilter(event.target.value)) {
              onChange({ ...filters, status: event.target.value })
            }
          }}
        >
          <option value="all">All statuses</option>
          <option value="unwatched">Not watching</option>
          <option value="watched">Watched</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm text-secondary" htmlFor={sortId}>
          Order
        </label>
        <select
          id={sortId}
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
      <div
        className={cn(
          'flex flex-wrap gap-2',
          isDesktop && 'md:col-span-2 lg:col-span-5',
        )}
      >
        <FilterCheckButton
          id={showRatingId}
          label="Show rating"
          tone="gold"
          checked={filters.showRating}
          onChange={(showRating) => onChange({ ...filters, showRating })}
        />
        <FilterCheckButton
          id={showReviewsId}
          label="Show reviews"
          tone="violet"
          checked={filters.showReviews}
          onChange={(showReviews) => onChange({ ...filters, showReviews })}
        />
      </div>
      {showClearLink && countActiveWatchlistFilters(filters) > 0 ? (
        <div className={cn(isDesktop && 'md:col-span-2 lg:col-span-5')}>
          <button
            type="button"
            className="text-sm text-heading underline decoration-border-strong underline-offset-2 hover:text-primary-emphasis"
            onClick={() => onChange(DEFAULT_WATCHLIST_FILTERS)}
          >
            Clear filters
          </button>
        </div>
      ) : null}
    </div>
  )
}

function WatchlistFiltersOverlay({
  draft,
  activeCount,
  resultCount,
  titleId,
  onDraftChange,
  onClose,
  onClearAll,
  onShowResults,
}: {
  draft: WatchlistFilters
  activeCount: number
  resultCount: number
  titleId: string
  onDraftChange: (filters: WatchlistFilters) => void
  onClose: () => void
  onClearAll: () => void
  onShowResults: () => void
}) {
  return createPortal(
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-50 flex h-dvh min-h-dvh w-full flex-col bg-bg md:hidden"
      role="dialog"
    >
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-4 py-4">
        <div className="min-w-0">
          <h2
            className="font-display text-lg tracking-[0.12em] text-heading uppercase"
            id={titleId}
          >
            Filters
          </h2>
          <p className="mt-1 text-sm text-secondary">
            {activeCount === 0
              ? 'No filters selected'
              : `${String(activeCount)} selected`}
          </p>
        </div>
        <Button
          aria-label="Close filters"
          className="shrink-0"
          onClick={onClose}
          size="sm"
          type="button"
          variant="ghost"
        >
          <X aria-hidden="true" className="size-5" />
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-none px-4 py-4">
        <WatchlistFiltersFields
          filters={draft}
          idPrefix="mobile-"
          onChange={onDraftChange}
        />
      </div>
      <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button onClick={onClearAll} type="button" variant="ghost">
          Clear all
        </Button>
        <Button onClick={onShowResults} type="button">
          Show {String(resultCount)} results
        </Button>
      </footer>
    </div>,
    document.body,
  )
}

export function WatchlistFilters({
  filters,
  onChange,
  matchCount,
}: WatchlistFiltersProps) {
  const titleId = useId()
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [draft, setDraft] = useState(filters)
  const appliedCount = countActiveWatchlistFilters(filters)
  const draftCount = countActiveWatchlistFilters(draft)
  const draftResultCount = matchCount(draft)

  useEffect(() => {
    if (!overlayOpen) {
      return undefined
    }

    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
    }
  }, [overlayOpen])

  function closeOverlay() {
    setOverlayOpen(false)
    setDraft(filters)
  }

  return (
    <>
      <div className="md:hidden">
        <Button
          aria-label={
            appliedCount > 0
              ? `Open filters, ${String(appliedCount)} selected`
              : 'Open filters'
          }
          className="gap-2"
          onClick={() => {
            setDraft(filters)
            setOverlayOpen(true)
          }}
          size="sm"
          type="button"
          variant="secondary"
        >
          <SlidersHorizontal aria-hidden="true" className="size-4" />
          Filters
          {appliedCount > 0 ? (
            <span className={chipClasses('green', 'pill')}>{appliedCount}</span>
          ) : null}
        </Button>
      </div>
      <form
        className="hidden md:block"
        onSubmit={(event) => event.preventDefault()}
      >
        <WatchlistFiltersFields
          filters={filters}
          layout="desktop"
          onChange={onChange}
          showClearLink
        />
      </form>
      {overlayOpen ? (
        <WatchlistFiltersOverlay
          activeCount={draftCount}
          draft={draft}
          onClearAll={() => {
            setDraft(DEFAULT_WATCHLIST_FILTERS)
          }}
          onClose={closeOverlay}
          onDraftChange={setDraft}
          onShowResults={() => {
            onChange(draft)
            setOverlayOpen(false)
          }}
          resultCount={draftResultCount}
          titleId={titleId}
        />
      ) : null}
    </>
  )
}
