import { Badge } from '@/components/ui/badge'
import { SpoilerCover } from '@/features/reviews/SpoilerCover'
import { formatRating } from '@/features/reviews/review-metrics'
import type { ReviewRow } from '@/features/reviews/review-schemas'

type ReviewCardProps = {
  review: ReviewRow
  displayName: string
  isOwn: boolean
}

export function ReviewCard({ review, displayName, isOwn }: ReviewCardProps) {
  return (
    <article className="elevated-card space-y-3 rounded-xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-heading">{displayName}</p>
        <Badge tone="rating">{formatRating(review.rating)} / 10</Badge>
      </div>
      {review.body ? (
        isOwn ? (
          <p className="whitespace-pre-wrap text-muted">{review.body}</p>
        ) : (
          <SpoilerCover active={review.contains_spoilers}>
            {review.body}
          </SpoilerCover>
        )
      ) : (
        <p className="text-sm text-muted">Rated without a written review.</p>
      )}
    </article>
  )
}
