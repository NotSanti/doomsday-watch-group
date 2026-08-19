import { PLACEHOLDER_DISPLAY_NAME } from '@/features/auth/auth-schemas'
import type { GroupMember } from '@/features/groups/group-schemas'
import {
  formatRating,
  reviewHoverPreview,
} from '@/features/reviews/review-metrics'
import type { ReviewRow } from '@/features/reviews/review-schemas'
import {
  Tooltip,
  TooltipContent,
  TooltipLabel,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type ReviewPreviewBubbleProps = {
  titleName: string
  reviews: readonly ReviewRow[]
  members: readonly GroupMember[]
  currentUserId: string
  className?: string
}

function nameFor(members: readonly GroupMember[], userId: string): string {
  return (
    members.find((member) => member.user_id === userId)?.display_name ??
    PLACEHOLDER_DISPLAY_NAME
  )
}

export function ReviewPreviewBubble({
  titleName,
  reviews,
  members,
  currentUserId,
  className,
}: ReviewPreviewBubbleProps) {
  if (reviews.length === 0) {
    return null
  }

  const countLabel = `${String(reviews.length)} ${reviews.length === 1 ? 'review' : 'reviews'} for ${titleName}`

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={countLabel}
            className={cn(
              'review-bubble-glow flex size-5 items-center justify-center rounded-full border border-multiverse bg-multiverse text-[10px] font-semibold text-heading',
              className,
            )}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
            }}
            onPointerDown={(event) => {
              event.stopPropagation()
            }}
          >
            {reviews.length}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" align="end">
          <TooltipLabel>{countLabel}</TooltipLabel>
          <ul className="max-h-64 space-y-3 overflow-y-auto">
            {reviews.map((review) => {
              const isOwn = review.user_id === currentUserId

              return (
                <li key={review.id} className="space-y-1">
                  <p className="flex items-baseline justify-between gap-3">
                    <span className="text-heading">
                      {nameFor(members, review.user_id)}
                      {isOwn ? ' (you)' : ''}
                    </span>
                    <span className="gold-text text-xs">
                      {formatRating(review.rating)} / 10
                    </span>
                  </p>
                  <p className="text-muted">
                    {reviewHoverPreview(review, isOwn)}
                  </p>
                </li>
              )
            })}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
