import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { GroupMember } from '@/features/groups/group-schemas'
import { StatusControl } from '@/features/progress/StatusControl'
import { ReviewPreviewBubble } from '@/features/reviews/ReviewPreviewBubble'
import type { ReviewRow } from '@/features/reviews/review-schemas'
import { ImportanceBadge } from '@/features/watchlist/ImportanceBadge'
import { SkipTitleControl } from '@/features/watchlist/SkipTitleControl'
import { TitleTypeChip } from '@/features/watchlist/TitleTypeChip'
import {
  MEDIA_TYPE_LABEL,
  isTitleWatched,
  sequenceForTitle,
  titleRuntimeLabel,
  titleYear,
  type TitleRow,
  type TitleStatus,
} from '@/features/watchlist/title-schemas'
import type { WatchlistSort } from '@/features/watchlist/title-filters'
import { cn } from '@/lib/utils'

type TitleCardProps = {
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
  statusDisabled?: boolean
  onStatusChange: (status: TitleStatus) => void
  reviews: readonly ReviewRow[]
  members: readonly GroupMember[]
  currentUserId: string
}

export function TitleCard({
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
  statusDisabled = false,
  onStatusChange,
  reviews,
  members,
  currentUserId,
}: TitleCardProps) {
  const year = titleYear(title.release_date)
  const runtime = titleRuntimeLabel(title)
  const sequence = sequenceForTitle(title, sort)
  const dimmed = isTitleWatched(status) || skipped

  return (
    <Card className={cn('relative h-full p-0', dimmed && 'opacity-50')}>
      <Link to={href} className="block">
        <div className="flex gap-3 p-4 pb-2">
          <TitleTypeChip mediaType={title.media_type} />
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-xs tracking-[0.14em] text-secondary uppercase">
              {String(sequence).padStart(2, '0')}
            </p>
            <h3 className="font-display text-lg tracking-[0.06em] text-heading uppercase">
              {title.name}
            </h3>
            <p className="text-sm text-muted">
              {[year, MEDIA_TYPE_LABEL[title.media_type], runtime]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>
      </Link>
      <div className="flex flex-wrap gap-2 px-4 pb-4">
        <ImportanceBadge importance={title.importance} />
        <StatusControl
          value={status}
          disabled={statusDisabled}
          onChange={onStatusChange}
          className="px-2.5 py-0.5 text-xs [&_svg]:size-3"
        />
        {!isTitleWatched(status) ? (
          <SkipTitleControl
            skipped={skipped}
            canToggle={canToggleSkip}
            disabled={skipDisabled}
            onToggle={onToggleSkip}
          />
        ) : null}
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
    </Card>
  )
}
