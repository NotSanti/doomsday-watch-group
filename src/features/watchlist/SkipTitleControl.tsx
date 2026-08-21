import { chipButtonClasses, chipClasses } from '@/lib/chip-styles'
import { cn } from '@/lib/utils'

type SkipTitleControlProps = {
  skipped: boolean
  canToggle: boolean
  disabled?: boolean
  onToggle: (nextSkipped: boolean) => void
}

export function SkipTitleControl({
  skipped,
  canToggle,
  disabled = false,
  onToggle,
}: SkipTitleControlProps) {
  if (!canToggle && !skipped) {
    return null
  }

  if (!canToggle) {
    return (
      <span className={chipClasses('danger', 'pill')} aria-label="Skipped">
        Skipped
      </span>
    )
  }

  return (
    <button
      type="button"
      aria-pressed={skipped}
      aria-label={skipped ? 'Unskip title' : 'Skip title'}
      disabled={disabled}
      className={cn(
        chipButtonClasses(skipped ? 'danger' : 'metal', 'rounded-full px-2.5 py-0.5 text-xs'),
        'transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50',
      )}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onToggle(!skipped)
      }}
    >
      {skipped ? 'Skipped' : 'Skip'}
    </button>
  )
}
