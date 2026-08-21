import { useState } from 'react'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { PLACEHOLDER_DISPLAY_NAME } from '@/features/auth/auth-schemas'
import type { GroupMember } from '@/features/groups/group-schemas'
import { ReviewCard } from '@/features/reviews/ReviewCard'
import { ReviewForm } from '@/features/reviews/ReviewForm'
import {
  averageRating,
  formatRating,
} from '@/features/reviews/review-metrics'
import { toFriendlyReviewListError } from '@/features/reviews/review-errors'
import type { ReviewFormValues, ReviewRow } from '@/features/reviews/review-schemas'

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
  const [editorOpen, setEditorOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

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
  const listed = mine ? [mine, ...others] : others
  const ratings = reviews.map((review) => review.rating)
  const average = averageRating(ratings)
  const busy = isSaving || isDeleting

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

      {mine ? null : (
        <Button
          onClick={() => {
            setEditorOpen(true)
          }}
        >
          Write review
        </Button>
      )}

      <div className="space-y-3">
        {listed.length === 0 ? (
          <EmptyState
            title="No reviews yet"
            description="Be the first to rate this title for your group."
          />
        ) : (
          <ul className="space-y-3">
            {listed.map((review) => {
              const isOwn = review.user_id === currentUserId

              return (
                <li key={review.id}>
                  <ReviewCard
                    review={review}
                    member={memberFor(members, review.user_id)}
                    isOwn={isOwn}
                    onEdit={
                      isOwn
                        ? () => {
                            setEditorOpen(true)
                          }
                        : undefined
                    }
                    onDelete={
                      isOwn
                        ? () => {
                            setConfirmDelete(true)
                          }
                        : undefined
                    }
                  />
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <Dialog
        open={editorOpen}
        onOpenChange={(open) => {
          if (!busy) {
            setEditorOpen(open)
          }
        }}
      >
        <DialogContent
          className="md:w-[min(36rem,calc(100%-2rem))]"
          title={mine ? 'Edit review' : 'Write review'}
          onOpenAutoFocus={(event) => {
            event.preventDefault()
          }}
        >
          <ReviewForm
            key={mine?.id ?? 'new-review'}
            existing={mine}
            isSaving={isSaving}
            onSave={async (values) => {
              await onSave(values)
              setEditorOpen(false)
            }}
            onCancel={() => {
              setEditorOpen(false)
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent title="Delete review">
          <p className="text-sm text-muted">
            This removes your rating and review for this title.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              variant="danger"
              disabled={busy}
              onClick={async () => {
                if (!mine) {
                  return
                }

                await onDelete(mine.id)
                setConfirmDelete(false)
              }}
            >
              {isDeleting ? 'Deleting…' : 'Delete review'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setConfirmDelete(false)
              }}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
