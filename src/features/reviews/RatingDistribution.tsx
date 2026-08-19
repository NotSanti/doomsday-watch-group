import { formatRating } from '@/features/reviews/review-metrics'
import { ratingDistribution } from '@/features/reviews/review-metrics'
import { cn } from '@/lib/utils'

type RatingDistributionProps = {
  ratings: readonly number[]
}

export function RatingDistribution({ ratings }: RatingDistributionProps) {
  const buckets = ratingDistribution(ratings)
  const max = Math.max(1, ...buckets.map((bucket) => bucket.count))

  return (
    <div>
      <h3 className="mb-3 text-sm text-secondary">Rating distribution</h3>
      <ul className="flex h-24 items-end gap-1">
        {buckets.map((bucket) => {
          const height = bucket.count === 0 ? 4 : Math.max(8, (bucket.count / max) * 100)

          return (
            <li key={bucket.value} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span
                className={cn(
                  'w-full rounded-t-sm',
                  bucket.count > 0 ? 'bg-accent' : 'bg-surface-elevated',
                )}
                style={{ height: `${String(height)}%` }}
                title={`${formatRating(bucket.value)}: ${String(bucket.count)}`}
              />
              {Number.isInteger(bucket.value) ? (
                <span className="text-[10px] text-muted">{formatRating(bucket.value)}</span>
              ) : (
                <span className="text-[10px] text-transparent">.</span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
