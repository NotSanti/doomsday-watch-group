import { useState } from 'react'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { RankedTitleList } from '@/features/members/RankedTitleList'
import {
  TITLE_RANKING_PREVIEW_LIMIT,
  rankTitlesByAverageRating,
} from '@/features/members/title-ranking'
import { toFriendlyReviewListError } from '@/features/reviews/review-errors'
import type { ReviewRow } from '@/features/reviews/review-schemas'
import type { TitleRow } from '@/features/watchlist/title-schemas'

type GroupTitleRankingSectionProps = {
  groupId: string
  titles: readonly TitleRow[]
  reviews: readonly ReviewRow[]
  isPending: boolean
  isError: boolean
  onRetry: () => void
}

export function GroupTitleRankingSection({
  groupId,
  titles,
  reviews,
  isPending,
  isError,
  onRetry,
}: GroupTitleRankingSectionProps) {
  const [open, setOpen] = useState(false)
  const ranked = rankTitlesByAverageRating(titles, reviews)
  const preview = ranked.slice(0, TITLE_RANKING_PREVIEW_LIMIT)
  const canViewAll = ranked.length > TITLE_RANKING_PREVIEW_LIMIT

  if (isPending) {
    return (
      <div role="status" aria-live="polite" className="space-y-2">
        <span className="sr-only">Loading title ranking</span>
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  if (isError) {
    return <ErrorState message={toFriendlyReviewListError()} onRetry={onRetry} />
  }

  if (ranked.length === 0) {
    return (
      <EmptyState
        title="No ratings yet"
        description="Rate titles from the watchlist to build the group ranking."
      />
    )
  }

  return (
    <div
      className="min-w-0 max-w-full space-y-3"
      data-testid="group-title-ranking"
    >
      {canViewAll ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="View all group ranked titles"
            onClick={() => {
              setOpen(true)
            }}
          >
            View all
          </Button>
        </div>
      ) : null}
      <RankedTitleList
        items={preview}
        groupId={groupId}
        label="Top rated titles"
      />
      {canViewAll ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent
            title="Title ranking"
            description="Group average ratings, highest first."
            className="md:flex md:max-h-[min(40rem,calc(100dvh-2rem))] md:w-[min(42rem,calc(100%-2rem))] md:flex-col md:overflow-hidden"
          >
            <RankedTitleList
              items={ranked}
              groupId={groupId}
              label="All ranked titles"
              className="min-h-0 flex-1 overflow-y-auto scrollbar-none md:max-h-[min(28rem,55vh)]"
            />
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  )
}
