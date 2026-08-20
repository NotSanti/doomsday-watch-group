import { cn } from '@/lib/utils'

type ProgressBarProps = {
  value: number
  label?: string
  ariaLabel?: string
  className?: string
}

export function ProgressBar({
  value,
  label,
  ariaLabel,
  className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const accessibleLabel = ariaLabel ?? label ?? 'Progress'

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn(
          'flex items-center text-sm',
          label ? 'justify-between' : 'justify-end',
        )}
      >
        {label ? (
          <span className="text-muted uppercase tracking-[0.08em]">{label}</span>
        ) : null}
        <span className="text-heading">{Math.round(clamped)}%</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-surface-elevated"
        role="progressbar"
        aria-label={accessibleLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clamped)}
      >
        <div
          className="h-full rounded-full bg-linear-to-r from-primary to-primary-emphasis transition-[width] duration-200"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
