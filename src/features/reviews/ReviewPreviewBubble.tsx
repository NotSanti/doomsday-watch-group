import { PLACEHOLDER_DISPLAY_NAME } from '@/features/auth/auth-schemas'
import { MemberAvatar } from '@/features/groups/MemberAvatar'
import type { GroupMember } from '@/features/groups/group-schemas'
import {
  formatRating,
  reviewHoverPreview,
} from '@/features/reviews/review-metrics'
import type { ReviewRow } from '@/features/reviews/review-schemas'
import {
  Popover,
  PopoverContent,
  PopoverLabel,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type ReviewPreviewBubbleProps = {
  titleName: string
  reviews: readonly ReviewRow[]
  members: readonly GroupMember[]
  currentUserId: string
  className?: string
}

function memberFor(
  members: readonly GroupMember[],
  userId: string,
): Pick<GroupMember, 'display_name' | 'avatar_url' | 'role'> {
  return (
    members.find((member) => member.user_id === userId) ?? {
      display_name: PLACEHOLDER_DISPLAY_NAME,
      avatar_url: null,
      role: 'member',
    }
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
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={countLabel}
          className={cn(
            'review-bubble-glow flex size-5 items-center justify-center rounded-full bg-chip-violet-fg text-[10px] font-semibold text-on-primary',
            className,
          )}
          onClick={(event) => {
            event.stopPropagation()
          }}
          onPointerDown={(event) => {
            event.stopPropagation()
          }}
        >
          {reviews.length}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        onOpenAutoFocus={(event) => {
          event.preventDefault()
        }}
      >
        <PopoverLabel>{countLabel}</PopoverLabel>
        <ul className="max-h-64 space-y-3 overflow-y-auto">
          {reviews.map((review) => {
            const isOwn = review.user_id === currentUserId
            const member = memberFor(members, review.user_id)

            return (
              <li key={review.id} className="flex items-start gap-2.5">
                <MemberAvatar member={member} />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-heading">
                      {member.display_name}
                      {isOwn ? ' (you)' : ''}
                    </span>
                    <span className="gold-text shrink-0 text-xs">
                      {formatRating(review.rating)} / 10
                    </span>
                  </p>
                  <p className="text-muted">
                    {reviewHoverPreview(review, isOwn)}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
