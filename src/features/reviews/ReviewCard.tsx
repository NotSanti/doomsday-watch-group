import { Pencil, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { MemberAvatar } from '@/features/groups/MemberAvatar'
import { MemberName } from '@/features/groups/MemberName'
import type { GroupMember } from '@/features/groups/group-schemas'
import { RatingStars } from '@/features/reviews/RatingStars'
import { SpoilerCover } from '@/features/reviews/SpoilerCover'
import type { ReviewRow } from '@/features/reviews/review-schemas'
import { cn } from '@/lib/utils'

type ReviewCardProps = {
  review: ReviewRow
  member: Pick<GroupMember, 'display_name' | 'avatar_url' | 'role'>
  isOwn: boolean
  onEdit?: () => void
  onDelete?: () => void
}

export function ReviewCard({
  review,
  member,
  isOwn,
  onEdit,
  onDelete,
}: ReviewCardProps) {
  return (
    <Card className="group p-4">
      <div className="flex items-start gap-3">
        <MemberAvatar member={member} size="xs" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <MemberName
                as="p"
                className="font-display tracking-[0.06em] text-heading"
              >
                {member.display_name}
              </MemberName>
              <RatingStars rating={review.rating} />
            </div>
            {isOwn && onEdit && onDelete ? (
              <ReviewCardActions onEdit={onEdit} onDelete={onDelete} />
            ) : null}
          </div>
          {review.body ? (
            isOwn ? (
              <p className="whitespace-pre-wrap text-muted uppercase">
                {review.body}
              </p>
            ) : (
              <SpoilerCover active={review.contains_spoilers}>
                {review.body}
              </SpoilerCover>
            )
          ) : null}
        </div>
      </div>
    </Card>
  )
}

function ReviewCardActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <TooltipProvider>
      <div
        className={cn(
          'flex shrink-0 items-center gap-1 transition-opacity',
          'opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100',
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Edit review"
              className="rounded-md p-1.5 text-secondary hover:bg-surface hover:text-heading focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
              onClick={onEdit}
            >
              <Pencil className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="px-2.5 py-1.5" side="top">
            Edit review
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Delete review"
              className="rounded-md p-1.5 text-secondary hover:bg-surface hover:text-danger focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
              onClick={onDelete}
            >
              <Trash2 className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="px-2.5 py-1.5" side="top">
            Delete review
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
