import { formatRating } from '@/features/reviews/review-metrics'
import type { ActivityEvent } from '@/features/activity/activity-schemas'

export function formatActivityMessage(event: ActivityEvent): string {
  const title = event.title_name ?? 'a title'

  switch (event.event_type) {
    case 'joined':
      return `${event.actor_name} joined the group`
    case 'started':
      return `${event.actor_name} started ${title}`
    case 'completed':
      return `${event.actor_name} watched ${title}`
    case 'rated':
      return event.rating === null
        ? `${event.actor_name} rated ${title}`
        : `${event.actor_name} rated ${title} ${formatRating(event.rating)}/10`
    case 'reviewed':
      return `${event.actor_name} reviewed ${title}`
  }
}
