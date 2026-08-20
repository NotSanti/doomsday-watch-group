import { useId } from 'react'
import { Star } from 'lucide-react'
import { formatRating, starFill, visibleStarCount } from '@/features/reviews/review-metrics'
import { cn } from '@/lib/utils'

const SIZE_CLASS = {
  sm: 'size-3.5',
  md: 'size-8',
} as const

type RatingStarIconProps = {
  fill: 0 | 0.5 | 1
  size: keyof typeof SIZE_CLASS
  gradientId: string
}

export function RatingStarIcon({ fill, size, gradientId }: RatingStarIconProps) {
  const sizeClass = SIZE_CLASS[size]
  const gradient = `url(#${gradientId})`

  return (
    <span
      className={cn('pointer-events-none relative block', sizeClass)}
      aria-hidden="true"
    >
      <Star className={cn(sizeClass, 'text-muted')} strokeWidth={1.5} />
      <span
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: fill === 0 ? '0%' : fill === 0.5 ? '50%' : '100%' }}
      >
        <Star
          className={sizeClass}
          strokeWidth={1.5}
          style={{ fill: gradient, stroke: gradient, color: gradient }}
        />
      </span>
    </span>
  )
}

export function RatingGoldGradientDefs({ id }: { id: string }) {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-gold-gradient-start)" />
          <stop offset="48%" stopColor="var(--color-gold-gradient-mid)" />
          <stop offset="100%" stopColor="var(--color-gold-gradient-end)" />
        </linearGradient>
      </defs>
    </svg>
  )
}

type RatingStarsProps = {
  rating: number
  size?: keyof typeof SIZE_CLASS
  className?: string
}

export function RatingStars({
  rating,
  size = 'sm',
  className,
}: RatingStarsProps) {
  const gradientId = `rating-gold-${useId().replaceAll(':', '')}`
  const slots = visibleStarCount(rating)

  return (
    <span
      className={cn('inline-flex items-center gap-px', className)}
      aria-label={`${formatRating(rating)} out of 10`}
    >
      <RatingGoldGradientDefs id={gradientId} />
      {Array.from({ length: slots }, (_, index) => {
        const star = index + 1
        const fill = starFill(star, rating)

        return (
          <span
            key={star}
            data-testid={`review-star-${String(star)}`}
            data-fill={String(fill)}
            className={cn('inline-flex', SIZE_CLASS[size])}
          >
            <RatingStarIcon fill={fill} size={size} gradientId={gradientId} />
          </span>
        )
      })}
    </span>
  )
}
