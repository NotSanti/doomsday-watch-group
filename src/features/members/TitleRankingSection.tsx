import { useState } from 'react'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { MemberAvatar } from '@/features/groups/MemberAvatar'
import { MemberName } from '@/features/groups/MemberName'
import type { GroupMember } from '@/features/groups/group-schemas'
import { RankedTitleList } from '@/features/members/RankedTitleList'
import {
  TITLE_RANKING_PREVIEW_LIMIT,
  rankTitlesByRating,
} from '@/features/members/title-ranking'
import { toFriendlyReviewListError } from '@/features/reviews/review-errors'
import type { ReviewRow } from '@/features/reviews/review-schemas'
import type { TitleRow } from '@/features/watchlist/title-schemas'

type TitleRankingSectionProps = {
  groupId: string
  members: readonly GroupMember[]
  titles: readonly TitleRow[]
  reviews: readonly ReviewRow[]
  isPending: boolean
  isError: boolean
  onRetry: () => void
}

function RankingListSkeleton() {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <span className="sr-only">Loading title ranking</span>
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  )
}

function MemberTitleRanking({
  groupId,
  member,
  titles,
  reviews,
}: {
  groupId: string
  member: GroupMember
  titles: readonly TitleRow[]
  reviews: readonly ReviewRow[]
}) {
  const [open, setOpen] = useState(false)
  const ranked = rankTitlesByRating(
    titles,
    reviews.filter((review) => review.user_id === member.user_id),
  )
  const preview = ranked.slice(0, TITLE_RANKING_PREVIEW_LIMIT)
  const canViewAll = ranked.length > TITLE_RANKING_PREVIEW_LIMIT

  return (
    <article
      className="elevated-card min-w-0 max-w-full space-y-3 overflow-hidden rounded-xl p-4"
      data-testid="title-ranking-card"
    >
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <MemberAvatar member={member} highlightOwner />
          <h3 className="min-w-0 flex-1">
            <MemberName as="span" className="block truncate text-heading">
              {member.display_name}
            </MemberName>
          </h3>
        </div>
        {canViewAll ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`View all titles ranked by ${member.display_name}`}
            onClick={() => {
              setOpen(true)
            }}
          >
            View all
          </Button>
        ) : null}
      </div>
      {ranked.length === 0 ? (
        <p className="text-sm text-muted">No ratings yet.</p>
      ) : (
        <RankedTitleList
          items={preview}
          groupId={groupId}
          label={`Top rated titles for ${member.display_name}`}
        />
      )}
      {canViewAll ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent
            title={member.display_name}
            description="Personal ratings, highest first."
            className="md:flex md:max-h-[min(40rem,calc(100dvh-2rem))] md:w-[min(42rem,calc(100%-2rem))] md:flex-col md:overflow-hidden"
          >
            <RankedTitleList
              items={ranked}
              groupId={groupId}
              label={`All ranked titles for ${member.display_name}`}
              className="min-h-0 flex-1 overflow-y-auto scrollbar-none md:max-h-[min(28rem,55vh)]"
            />
          </DialogContent>
        </Dialog>
      ) : null}
    </article>
  )
}

export function TitleRankingSection({
  groupId,
  members,
  titles,
  reviews,
  isPending,
  isError,
  onRetry,
}: TitleRankingSectionProps) {
  return (
    <section className="min-w-0 space-y-3">
      <h2 className="font-display text-2xl tracking-[0.08em] text-heading uppercase">
        Title ranking
      </h2>
      {isPending ? (
        <RankingListSkeleton />
      ) : isError ? (
        <ErrorState message={toFriendlyReviewListError()} onRetry={onRetry} />
      ) : members.length === 0 ? (
        <EmptyState
          title="No members yet"
          description="Invite friends to start comparing personal rankings."
        />
      ) : (
        <ul className="grid min-w-0 gap-3">
          {members.map((member) => (
            <li
              key={`${member.group_id}:${member.user_id}`}
              className="min-w-0"
            >
              <MemberTitleRanking
                groupId={groupId}
                member={member}
                titles={titles}
                reviews={reviews}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
