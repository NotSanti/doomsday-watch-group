import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import type { GroupMember } from '@/features/groups/group-schemas'
import { ReviewPreviewBubble } from '@/features/reviews/ReviewPreviewBubble'
import type { ReviewRow } from '@/features/reviews/review-schemas'
import { SkipTitleControl } from '@/features/watchlist/SkipTitleControl'
import { TitleTypeChip } from '@/features/watchlist/TitleTypeChip'
import type { WatchlistSort } from '@/features/watchlist/title-filters'
import {
  IMPORTANCE_LABEL,
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

type TitleRowProps = {
  title: TitleRow
  status: TitleStatus
  sort: WatchlistSort
  href: string
  groupWatchedLabel: string
  averageRatingLabel: string
  showRating: boolean
  showReviews: boolean
  skipped: boolean
  canToggleSkip: boolean
  skipDisabled?: boolean
  onToggleSkip: (skipped: boolean) => void
  reviews: readonly ReviewRow[]
  members: readonly GroupMember[]
  currentUserId: string
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
  showRating,
  showReviews,
  skipped,
  canToggleSkip,
  skipDisabled = false,
  onToggleSkip,
  reviews,
  members,
  currentUserId,
}: TitleRowProps) {
  const year = titleYear(title.release_date)
  const runtime = titleRuntimeLabel(title)
  const sequence = sequenceForTitle(title, sort)
  const dimmed = isTitleWatched(status) || skipped

  return (
    <div className={cn('relative', dimmed && 'opacity-50')}>
      <div className="grid grid-cols-[3rem_2.5rem_minmax(0,1fr)_auto] items-center gap-4 rounded-xl border border-border bg-surface-card px-3 py-2 hover:border-primary-emphasis/40 hover:bg-surface-hover">
        <Link to={href} className="contents">
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
        </Link>
        <div className="hidden flex-wrap items-center justify-end gap-2 sm:flex">
          <Badge>{IMPORTANCE_LABEL[title.importance]}</Badge>
          <Badge tone={statusTone(status)}>{TITLE_STATUS_LABEL[status]}</Badge>
          <SkipTitleControl
            skipped={skipped}
            canToggle={canToggleSkip}
            disabled={skipDisabled}
            onToggle={onToggleSkip}
          />
          <Badge tone="muted">{groupWatchedLabel}</Badge>
          {showRating ? (
            <Badge tone="rating">{averageRatingLabel}</Badge>
          ) : null}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 sm:hidden">
        <Badge>{IMPORTANCE_LABEL[title.importance]}</Badge>
        <Badge tone={statusTone(status)}>{TITLE_STATUS_LABEL[status]}</Badge>
        <SkipTitleControl
          skipped={skipped}
          canToggle={canToggleSkip}
          disabled={skipDisabled}
          onToggle={onToggleSkip}
        />
        <Badge tone="muted">{groupWatchedLabel}</Badge>
        {showRating ? (
          <Badge tone="rating">{averageRatingLabel}</Badge>
        ) : null}
      </div>
      {showReviews ? (
        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="pointer-events-auto absolute top-1.5 right-1.5">
            <ReviewPreviewBubble
              titleName={title.name}
              reviews={reviews}
              members={members}
              currentUserId={currentUserId}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
