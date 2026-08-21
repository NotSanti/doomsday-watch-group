import { Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ImportanceBadge } from '@/features/watchlist/ImportanceBadge'
import { TitleTypeChip } from '@/features/watchlist/TitleTypeChip'
import type { WatchlistSort } from '@/features/watchlist/title-filters'
import {
  MEDIA_TYPE_LABEL,
  TITLE_STATUS_LABEL,
  isTitleWatched,
  sequenceForTitle,
  titleRuntimeLabel,
  titleYear,
  type TitleRow,
  type TitleStatus,
} from '@/features/watchlist/title-schemas'
import { cn } from '@/lib/utils'

type SelectableTitleRowProps = {
  title: TitleRow
  status: TitleStatus
  sort: WatchlistSort
  selected: boolean
  onSelect: () => void
}

function statusTone(status: TitleStatus) {
  if (status === 'watched') {
    return 'watched' as const
  }

  return 'notStarted' as const
}

export function SelectableTitleRow({
  title,
  status,
  sort,
  selected,
  onSelect,
}: SelectableTitleRowProps) {
  const year = titleYear(title.release_date)
  const runtime = titleRuntimeLabel(title)
  const sequence = sequenceForTitle(title, sort)
  const watched = isTitleWatched(status)

  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      aria-label={title.name}
      onClick={onSelect}
      className={cn(
        'grid w-full grid-cols-[auto_3rem_2.5rem_minmax(0,1fr)] items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors duration-200 sm:grid-cols-[auto_3rem_2.5rem_minmax(0,1fr)_auto]',
        selected
          ? 'border-primary-emphasis/60 bg-surface-hover'
          : 'border-border bg-surface-card hover:border-primary-emphasis/40 hover:bg-surface-hover',
        watched && 'opacity-50',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex size-5 shrink-0 items-center justify-center rounded border',
          selected
            ? 'border-primary bg-primary text-on-primary'
            : 'border-border bg-surface',
        )}
      >
        {selected ? <Check className="size-3.5" strokeWidth={3} /> : null}
      </span>
      <p className="text-xs tracking-[0.14em] text-secondary uppercase">
        {String(sequence).padStart(2, '0')}
      </p>
      <TitleTypeChip mediaType={title.media_type} />
      <div className="min-w-0">
        <p className="truncate font-display text-lg tracking-[0.06em] text-heading uppercase">
          {title.name}
        </p>
        <p className="truncate text-sm text-muted">
          {[year, MEDIA_TYPE_LABEL[title.media_type], runtime]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
      <div className="hidden flex-wrap justify-end gap-2 sm:flex">
        <ImportanceBadge importance={title.importance} />
        <Badge tone={statusTone(status)}>{TITLE_STATUS_LABEL[status]}</Badge>
      </div>
    </button>
  )
}
