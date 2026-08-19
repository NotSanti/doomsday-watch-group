import { Check } from 'lucide-react'
import {
  isTitleWatched,
  type TitleStatus,
} from '@/features/watchlist/title-schemas'
import { chipClasses } from '@/lib/chip-styles'
import { cn } from '@/lib/utils'

type StatusControlProps = {
  value: TitleStatus
  disabled?: boolean
  onChange: (status: TitleStatus) => void
  className?: string
}

export function StatusControl({
  value,
  disabled = false,
  onChange,
  className,
}: StatusControlProps) {
  const watched = isTitleWatched(value)

  return (
    <div className={cn('space-y-1', className)}>
      <p className="text-sm text-secondary">My status</p>
      <button
        type="button"
        disabled={disabled}
        aria-pressed={watched}
        onClick={() => {
          onChange(watched ? 'not_started' : 'watched')
        }}
        className={cn(
          'gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors duration-200',
          watched
            ? chipClasses('green', 'pill')
            : cn(
                chipClasses('metal', 'pill'),
                'hover:border-chip-metal-fg hover:text-chip-metal-fg',
              ),
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        {watched ? <Check className="size-4" aria-hidden="true" /> : null}
        {watched ? 'Watched' : 'Not watching'}
      </button>
    </div>
  )
}
