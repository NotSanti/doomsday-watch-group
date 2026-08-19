import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import type { GroupMember } from '@/features/groups/group-schemas'
import { ReviewCard } from '@/features/reviews/ReviewCard'
import { ReviewForm } from '@/features/reviews/ReviewForm'
import {
  averageRating,
  formatRating,
} from '@/features/reviews/review-metrics'
import { toFriendlyReviewListError } from '@/features/reviews/review-errors'
import type { ReviewFormValues, ReviewRow } from '@/features/reviews/review-schemas'
import { PLACEHOLDER_DISPLAY_NAME } from '@/features/auth/auth-schemas'

type TitleReviewsProps = {
  currentUserId: string
  members: readonly GroupMember[]
  reviews: readonly ReviewRow[]
  isPending: boolean
  isError: boolean
  isSaving: boolean
  isDeleting: boolean
  onRetry: () => void
  onSave: (values: ReviewFormValues) => Promise<unknown> | void
  onDelete: (reviewId: string) => Promise<unknown> | void
}

function nameFor(members: readonly GroupMember[], userId: string): string {
  return (
    members.find((member) => member.user_id === userId)?.display_name ??
    PLACEHOLDER_DISPLAY_NAME
  )
}

export function TitleReviews({
  currentUserId,
  members,
  reviews,
  isPending,
  isError,
  isSaving,
  isDeleting,
  onRetry,
  onSave,
  onDelete,
}: TitleReviewsProps) {
  if (isPending) {
    return (
      <div role="status" aria-live="polite">
        <span className="sr-only">Loading reviews</span>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-4 h-32 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorState message={toFriendlyReviewListError()} onRetry={onRetry} />
    )
  }

  const mine = reviews.find((review) => review.user_id === currentUserId) ?? null
  const others = reviews.filter((review) => review.user_id !== currentUserId)
  const ratings = reviews.map((review) => review.rating)
  const average = averageRating(ratings)
  const unrated = members.filter(
    (member) => !reviews.some((review) => review.user_id === member.user_id),
  )

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h2 className="font-display text-2xl tracking-[0.08em] text-heading uppercase">
          Ratings and reviews
        </h2>
        {average === null ? (
          <p className="text-sm text-secondary">No ratings yet.</p>
        ) : (
          <p className="gold-text font-display text-3xl tracking-[0.06em]">
            {formatRating(average)}
            <span className="ml-2 text-sm text-secondary">
              group average · {ratings.length}{' '}
              {ratings.length === 1 ? 'rating' : 'ratings'}
            </span>
          </p>
        )}
      </header>

      <div className="space-y-3">
        <h3 className="font-display text-xl tracking-[0.08em] text-heading uppercase">
          Your review
        </h3>
        <ReviewForm
          key={mine?.id ?? 'new-review'}
          existing={mine}
          isSaving={isSaving}
          isDeleting={isDeleting}
          onSave={onSave}
          onDelete={
            mine
              ? () => onDelete(mine.id)
              : undefined
          }
        />
      </div>

      <div className="space-y-3">
        <h3 className="font-display text-xl tracking-[0.08em] text-heading uppercase">
          Group reviews
        </h3>
        {others.length === 0 ? (
          <EmptyState
            title="No other reviews"
            description="When other members rate this title, their reviews will appear here."
          />
        ) : (
          <ul className="space-y-3">
            {others.map((review) => (
              <li key={review.id}>
                <ReviewCard
                  review={review}
                  displayName={nameFor(members, review.user_id)}
                  isOwn={false}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {unrated.length > 0 ? (
        <p className="text-sm text-secondary">
          Has not rated yet:{' '}
          {unrated.map((member) => member.display_name).join(', ')}
        </p>
      ) : null}
    </section>
  )
}
