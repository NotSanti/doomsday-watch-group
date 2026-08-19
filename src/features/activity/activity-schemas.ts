import { z } from 'zod'
import { PLACEHOLDER_DISPLAY_NAME } from '@/features/auth/auth-schemas'

export const activityEventTypeSchema = z.enum([
  'joined',
  'started',
  'completed',
  'rated',
  'reviewed',
])

export const activityQueryRowSchema = z.object({
  id: z.number(),
  group_id: z.string().uuid(),
  actor_id: z.string().uuid(),
  event_type: activityEventTypeSchema,
  title_id: z.string().uuid().nullable(),
  metadata: z.unknown(),
  created_at: z.string(),
  profiles: z
    .object({
      display_name: z.string().min(1),
    })
    .nullable(),
  titles: z
    .object({
      name: z.string().min(1),
    })
    .nullable(),
})

export type ActivityEventType = z.infer<typeof activityEventTypeSchema>
export type ActivityEvent = {
  id: number
  group_id: string
  actor_id: string
  event_type: ActivityEventType
  title_id: string | null
  title_name: string | null
  actor_name: string
  rating: number | null
  created_at: string
}

function ratingFromMetadata(metadata: unknown): number | null {
  if (!metadata || typeof metadata !== 'object' || !('rating' in metadata)) {
    return null
  }

  const value = metadata.rating
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

export function toActivityEvent(
  row: z.infer<typeof activityQueryRowSchema>,
): ActivityEvent {
  const displayName = row.profiles?.display_name.trim()

  return {
    id: row.id,
    group_id: row.group_id,
    actor_id: row.actor_id,
    event_type: row.event_type,
    title_id: row.title_id,
    title_name: row.titles?.name ?? null,
    actor_name:
      displayName && displayName.length > 0
        ? displayName
        : PLACEHOLDER_DISPLAY_NAME,
    rating: ratingFromMetadata(row.metadata),
    created_at: row.created_at,
  }
}
