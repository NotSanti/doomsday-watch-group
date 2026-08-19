import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { formatActivityMessage } from '@/features/activity/activity-copy'
import { toFriendlyActivityListError } from '@/features/activity/activity-errors'
import type { ActivityEvent } from '@/features/activity/activity-schemas'
import { formatDateInTimeZone } from '@/lib/timezone'

type ActivityFeedProps = {
  events: readonly ActivityEvent[]
  timeZone: string
  isPending: boolean
  isError: boolean
  onRetry: () => void
}

function formatStamp(iso: string, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone,
    }).format(new Date(iso))
  } catch {
    return formatDateInTimeZone(iso, timeZone)
  }
}

export function ActivityFeed({
  events,
  timeZone,
  isPending,
  isError,
  onRetry,
}: ActivityFeedProps) {
  if (isPending) {
    return (
      <div role="status" aria-live="polite">
        <span className="sr-only">Loading activity</span>
        <Skeleton className="h-16 w-full" />
        <Skeleton className="mt-2 h-16 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorState message={toFriendlyActivityListError()} onRetry={onRetry} />
    )
  }

  if (events.length === 0) {
    return (
      <EmptyState
        title="No activity yet"
        description="Joins, watches, ratings, and reviews will show up here."
      />
    )
  }

  return (
    <ol className="space-y-3">
      {events.map((event) => (
        <li
          key={event.id}
          className="elevated-card rounded-xl px-4 py-3"
        >
          <p className="text-heading">{formatActivityMessage(event)}</p>
          <p className="mt-1 text-xs text-muted">
            {formatStamp(event.created_at, timeZone)}
          </p>
        </li>
      ))}
    </ol>
  )
}
