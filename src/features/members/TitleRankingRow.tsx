import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { formatRating } from '@/features/reviews/review-metrics'
import { TitleArtwork } from '@/features/watchlist/TitleArtwork'
import type { TitleRow } from '@/features/watchlist/title-schemas'

type TitleRankingRowProps = {
  rank: number
  title: TitleRow
  rating: number
  href: string
}

export function TitleRankingRow({
  rank,
  title,
  rating,
  href,
}: TitleRankingRowProps) {
  const ratingLabel = formatRating(rating)

  return (
    <Link
      to={href}
      aria-label={`${String(rank)}. ${title.name}, ${ratingLabel} out of 10`}
      className="grid min-w-0 max-w-full grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border border-border bg-surface-card px-3 py-2 hover:border-primary-emphasis/40 hover:bg-surface-hover sm:gap-3"
    >
      <p className="w-6 shrink-0 text-center font-display text-lg tracking-[0.08em] text-secondary sm:w-8">
        {rank}
      </p>
      <TitleArtwork
        path={title.poster_path}
        alt=""
        className="w-10 shrink-0 rounded-md sm:w-11"
      />
      <p className="min-w-0 truncate font-display text-lg tracking-[0.06em] text-heading uppercase">
        {title.name}
      </p>
      <Badge tone="rating" className="max-w-full shrink-0 whitespace-nowrap">
        {ratingLabel}
        <span className="hidden sm:inline"> / 10</span>
      </Badge>
    </Link>
  )
}
