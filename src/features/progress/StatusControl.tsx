import {
  TITLE_STATUS_LABEL,
  titleStatusSchema,
  type TitleStatus,
} from '@/features/watchlist/title-schemas'
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
  return (
    <label className={cn('block max-w-xs', className)}>
      <span className="mb-1 block text-sm text-secondary">My status</span>
      <select
        aria-label="My status"
        className="h-11 w-full rounded-md border border-border bg-surface-card px-3 text-sm text-heading"
        disabled={disabled}
        value={value}
        onChange={(event) => {
          const parsed = titleStatusSchema.safeParse(event.target.value)
          if (parsed.success) {
            onChange(parsed.data)
          }
        }}
      >
        {titleStatusSchema.options.map((status) => (
          <option key={status} value={status}>
            {TITLE_STATUS_LABEL[status]}
          </option>
        ))}
      </select>
    </label>
  )
}
