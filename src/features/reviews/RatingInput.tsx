import { useState } from 'react'
import { Star } from 'lucide-react'
import { formatRating, starFill } from '@/features/reviews/review-metrics'
import { RATING_MAX, RATING_MIN } from '@/features/reviews/review-schemas'
import { cn } from '@/lib/utils'

type RatingInputProps = {
  value: number | null
  disabled?: boolean
  onChange: (value: number) => void
}

const STARS = Array.from({ length: RATING_MAX }, (_, index) => index + 1)
const RATING_STEP_HALF = 0.5

function RatingStarIcon({ fill }: { fill: 0 | 0.5 | 1 }) {
  return (
    <span className="pointer-events-none relative block size-8" aria-hidden="true">
      <Star className="size-8 text-muted" strokeWidth={1.5} />
      <span
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: fill === 0 ? '0%' : fill === 0.5 ? '50%' : '100%' }}
      >
        <Star
          className="size-8 fill-accent text-accent"
          strokeWidth={1.5}
        />
      </span>
    </span>
  )
}

export function RatingInput({
  value,
  disabled = false,
  onChange,
}: RatingInputProps) {
  const [preview, setPreview] = useState<number | null>(null)
  const shown = preview ?? value

  function choose(step: number) {
    if (disabled) {
      return
    }

    onChange(step)
  }

  return (
    <div>
      <p className="mb-2 text-sm text-secondary" id="rating-label">
        Your rating
      </p>
      <div
        role="radiogroup"
        aria-labelledby="rating-label"
        className={cn('flex flex-wrap items-center gap-0.5', disabled && 'opacity-50')}
        onMouseLeave={() => {
          setPreview(null)
        }}
      >
        {STARS.map((star) => {
          const fill = starFill(star, shown)
          const half = star - RATING_STEP_HALF
          const showHalfTarget = half >= RATING_MIN

          return (
            <span
              key={star}
              data-testid={`rating-star-${String(star)}`}
              data-fill={String(fill)}
              className="relative inline-flex size-8 rounded-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus"
            >
              <RatingStarIcon fill={fill} />
              {showHalfTarget ? (
                <RatingHitTarget
                  step={half}
                  checked={value !== null && Math.abs(value - half) < 1e-8}
                  disabled={disabled}
                  side="left"
                  onPreview={setPreview}
                  onChoose={choose}
                />
              ) : null}
              <RatingHitTarget
                step={star}
                checked={value !== null && Math.abs(value - star) < 1e-8}
                disabled={disabled}
                side={showHalfTarget ? 'right' : 'full'}
                onPreview={setPreview}
                onChoose={choose}
              />
            </span>
          )
        })}
        <p className="ml-2 min-w-16 text-sm text-accent" aria-live="polite">
          {shown === null ? 'Select a rating' : `${formatRating(shown)} / 10`}
        </p>
      </div>
    </div>
  )
}

function RatingHitTarget({
  step,
  checked,
  disabled,
  side,
  onPreview,
  onChoose,
}: {
  step: number
  checked: boolean
  disabled: boolean
  side: 'left' | 'right' | 'full'
  onPreview: (step: number) => void
  onChoose: (step: number) => void
}) {
  const label = formatRating(step)

  return (
    <label
      className={cn(
        'absolute inset-y-0 z-10',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        side === 'left' && 'left-0 w-1/2',
        side === 'right' && 'right-0 w-1/2',
        side === 'full' && 'inset-0',
      )}
      onMouseEnter={() => {
        if (!disabled) {
          onPreview(step)
        }
      }}
    >
      <input
        type="radio"
        name="title-rating"
        className="sr-only"
        value={step}
        checked={checked}
        disabled={disabled}
        aria-label={label}
        onChange={() => {
          onChoose(step)
        }}
        onMouseEnter={() => {
          if (!disabled) {
            onPreview(step)
          }
        }}
        onFocus={() => {
          if (!disabled) {
            onPreview(step)
          }
        }}
      />
    </label>
  )
}
