import { Check } from 'lucide-react'
import { isTitleWatched, type TitleStatus } from '@/features/watchlist/title-schemas'
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
          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-200',
          watched
            ? 'border-primary-emphasis/40 bg-primary-emphasis text-on-primary'
            : 'border-metal/40 bg-surface-elevated text-metal hover:border-border-strong hover:text-heading',
        )}
      >
        {watched ? <Check className="size-4" aria-hidden="true" /> : null}
        {watched ? 'Watched' : 'Not watching'}
      </button>
    </div>
  )
}
