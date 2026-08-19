import { RATING_STEPS } from '@/features/reviews/review-schemas'
import { formatRating } from '@/features/reviews/review-metrics'
import { cn } from '@/lib/utils'

type RatingInputProps = {
  value: number | null
  disabled?: boolean
  onChange: (value: number) => void
}

export function RatingInput({ value, disabled = false, onChange }: RatingInputProps) {
  return (
    <div>
      <p className="mb-2 text-sm text-secondary" id="rating-label">
        Your rating
      </p>
      <div
        role="radiogroup"
        aria-labelledby="rating-label"
        className="flex flex-wrap gap-1.5"
      >
        {RATING_STEPS.map((step) => {
          const checked =
            value !== null && Math.abs(value - step) < 1e-8

          return (
            <label
              key={step}
              className={cn(
                'inline-flex min-w-10 cursor-pointer items-center justify-center rounded-full border px-2 py-1 text-sm transition-colors duration-200',
                checked
                  ? 'border-accent/40 bg-accent text-on-primary rating-glow'
                  : 'border-border bg-surface-elevated text-secondary hover:border-accent/50 hover:text-heading',
                disabled && 'cursor-not-allowed opacity-50',
              )}
            >
              <input
                type="radio"
                name="title-rating"
                className="sr-only"
                value={step}
                checked={checked}
                disabled={disabled}
                onChange={() => {
                  onChange(step)
                }}
              />
              {formatRating(step)}
            </label>
          )
        })}
      </div>
    </div>
  )
}
