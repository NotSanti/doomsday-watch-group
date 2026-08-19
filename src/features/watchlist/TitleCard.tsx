import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { GroupMember } from '@/features/groups/group-schemas'
import { ReviewPreviewBubble } from '@/features/reviews/ReviewPreviewBubble'
import type { ReviewRow } from '@/features/reviews/review-schemas'
import { TitleArtwork } from '@/features/watchlist/TitleArtwork'
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
import type { WatchlistSort } from '@/features/watchlist/title-filters'

type TitleCardProps = {
  title: TitleRow
  status: TitleStatus
  sort: WatchlistSort
  href: string
  groupWatchedLabel: string
  averageRatingLabel: string
  showRating: boolean
  showReviews: boolean
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

export function TitleCard({
  title,
  status,
  sort,
  href,
  groupWatchedLabel,
  averageRatingLabel,
  showRating,
  showReviews,
  reviews,
  members,
  currentUserId,
}: TitleCardProps) {
  const year = titleYear(title.release_date)
  const runtime = titleRuntimeLabel(title)
  const sequence = sequenceForTitle(title, sort)

  return (
    <Card className="relative h-full p-0">
      <Link to={href} className="block h-full">
        <TitleArtwork path={title.poster_path} alt="" className="rounded-t-xl" />
        <div className="space-y-2 p-4">
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
          <div className="flex flex-wrap gap-2">
            <Badge>{IMPORTANCE_LABEL[title.importance]}</Badge>
            <Badge tone={statusTone(status)}>
              {TITLE_STATUS_LABEL[status]}
            </Badge>
            <Badge tone="muted">{groupWatchedLabel}</Badge>
            {showRating ? (
              <Badge tone="rating">{averageRatingLabel}</Badge>
            ) : null}
          </div>
        </div>
      </Link>
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
