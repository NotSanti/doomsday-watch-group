import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { TitleArtwork } from '@/features/watchlist/TitleArtwork'
import type { WatchlistSort } from '@/features/watchlist/title-filters'
import {
  IMPORTANCE_LABEL,
  MEDIA_TYPE_LABEL,
  TITLE_STATUS_LABEL,
  sequenceForTitle,
  titleRuntimeLabel,
  titleYear,
  type TitleRow,
  type TitleStatus,
} from '@/features/watchlist/title-schemas'

type TitleRowProps = {
  title: TitleRow
  status: TitleStatus
  sort: WatchlistSort
  href: string
  groupWatchedLabel: string
  averageRatingLabel: string
}

function statusTone(status: TitleStatus) {
  if (status === 'watched') {
    return 'watched' as const
  }

  return 'notStarted' as const
}

export function TitleRow({
  title,
  status,
  sort,
  href,
  groupWatchedLabel,
  averageRatingLabel,
}: TitleRowProps) {
  const year = titleYear(title.release_date)
  const runtime = titleRuntimeLabel(title)
  const sequence = sequenceForTitle(title, sort)

  return (
    <Link
      to={href}
      className="grid grid-cols-[3rem_4.5rem_minmax(0,1fr)_auto] items-center gap-4 rounded-xl border border-border bg-surface-card px-3 py-2 hover:border-primary-emphasis/40 hover:bg-surface-hover"
    >
      <p className="text-xs tracking-[0.14em] text-secondary uppercase">
        {String(sequence).padStart(2, '0')}
      </p>
      <TitleArtwork
        path={title.poster_path}
        alt=""
        className="h-16 w-[4.5rem] rounded-md"
      />
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
        <Badge>{IMPORTANCE_LABEL[title.importance]}</Badge>
        <Badge tone={statusTone(status)}>{TITLE_STATUS_LABEL[status]}</Badge>
        <Badge tone="muted">{groupWatchedLabel}</Badge>
        <Badge tone="rating">{averageRatingLabel}</Badge>
      </div>
    </Link>
  )
}
