import { useId, useState } from 'react'
import {
  RatingGoldGradientDefs,
  RatingStarIcon,
} from '@/features/reviews/RatingStars'
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

export function RatingInput({
  value,
  disabled = false,
  onChange,
}: RatingInputProps) {
  const [preview, setPreview] = useState<number | null>(null)
  const shown = preview ?? value
  const gradientId = `rating-input-gold-${useId().replaceAll(':', '')}`

  function choose(step: number) {
    if (disabled) {
      return
    }

    onChange(step)
  }

  return (
    <div>
      <RatingGoldGradientDefs id={gradientId} />
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
              <RatingStarIcon fill={fill} size="md" gradientId={gradientId} />
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
        <p
          className={cn(
            'ml-2 min-w-16 text-sm',
            shown === null ? 'text-secondary' : 'gold-text',
          )}
          aria-live="polite"
        >
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
      onMouseMove={() => {
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
        onMouseMove={() => {
          if (!disabled) {
            onPreview(step)
          }
        }}
      />
    </label>
  )
}
