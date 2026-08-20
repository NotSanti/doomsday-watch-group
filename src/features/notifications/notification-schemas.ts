import { z } from 'zod'

export const NOTIFICATION_TYPES = [
  'member_joined',
  'member_watched',
  'member_rated',
  'member_reviewed',
  'group_ready_for_next_title',
  'daily_countdown',
  'test',
] as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export const pushSubscriptionKeysSchema = z.object({
  p256dh: z.string().trim().min(1),
  auth: z.string().trim().min(1),
})

export const pushSubscriptionInputSchema = z.object({
  endpoint: z.string().url(),
  keys: pushSubscriptionKeysSchema,
  user_agent: z.string().trim().max(512).nullable().optional(),
})

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionInputSchema>

export const notificationPreferencesSchema = z.object({
  user_id: z.string().uuid(),
  member_joined: z.boolean(),
  member_watched: z.boolean(),
  member_rated: z.boolean(),
  member_reviewed: z.boolean(),
  group_ready_for_next_title: z.boolean(),
  daily_countdown: z.boolean(),
  last_daily_countdown_sent_on: z.string().nullable(),
  updated_at: z.string(),
})

export type NotificationPreferences = z.infer<
  typeof notificationPreferencesSchema
>

export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<
  NotificationPreferences,
  'user_id' | 'last_daily_countdown_sent_on' | 'updated_at'
> = {
  member_joined: true,
  member_watched: true,
  member_rated: true,
  member_reviewed: true,
  group_ready_for_next_title: true,
  daily_countdown: false,
}

export const preferenceKeyForType: Record<
  Exclude<NotificationType, 'test'>,
  keyof typeof DEFAULT_NOTIFICATION_PREFERENCES
> = {
  member_joined: 'member_joined',
  member_watched: 'member_watched',
  member_rated: 'member_rated',
  member_reviewed: 'member_reviewed',
  group_ready_for_next_title: 'group_ready_for_next_title',
  daily_countdown: 'daily_countdown',
}
