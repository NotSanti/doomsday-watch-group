export type NotificationType =
  | 'member_joined'
  | 'member_watched'
  | 'member_rated'
  | 'member_reviewed'
  | 'group_ready_for_next_title'
  | 'daily_countdown'
  | 'test'

export type StoredPushSubscription = {
  id: string
  endpoint: string
  p256dh: string
  auth: string
}

export type NotificationPreferencesRow = {
  member_joined: boolean
  member_watched: boolean
  member_rated: boolean
  member_reviewed: boolean
  group_ready_for_next_title: boolean
  daily_countdown: boolean
}

const preferenceMap: Record<
  Exclude<NotificationType, 'test'>,
  keyof NotificationPreferencesRow
> = {
  member_joined: 'member_joined',
  member_watched: 'member_watched',
  member_rated: 'member_rated',
  member_reviewed: 'member_reviewed',
  group_ready_for_next_title: 'group_ready_for_next_title',
  daily_countdown: 'daily_countdown',
}

export function isNotificationEnabled(
  preferences: NotificationPreferencesRow,
  type: NotificationType,
): boolean {
  if (type === 'test') {
    return true
  }

  const key = preferenceMap[type]
  return preferences[key]
}

export function parsePushPayload(payload: Record<string, unknown>): {
  title: string
  body: string
  url: string
} {
  const title =
    typeof payload.title === 'string' && payload.title.trim()
      ? payload.title
      : 'Doomsday Watch Group'
  const body =
    typeof payload.body === 'string' && payload.body.trim()
      ? payload.body
      : 'You have a new update from your watch group.'
  const url =
    typeof payload.url === 'string' && payload.url.trim() ? payload.url : '/'

  return { title, body, url }
}

export function normalizeEnvSecret(value: string | undefined): string {
  return value?.trim().replaceAll(/^["']|["']$/g, '') ?? ''
}
