import type { BrowserSupabaseClient } from '@/lib/supabase'
import {
  notificationPreferencesSchema,
  pushSubscriptionInputSchema,
  type NotificationPreferences,
  type PushSubscriptionInput,
} from '@/features/notifications/notification-schemas'

export async function upsertPushSubscription(
  client: BrowserSupabaseClient,
  userId: string,
  input: PushSubscriptionInput,
): Promise<void> {
  const parsed = pushSubscriptionInputSchema.parse(input)
  const { error } = await client.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: parsed.endpoint,
      p256dh: parsed.keys.p256dh,
      auth: parsed.keys.auth,
      user_agent: parsed.user_agent ?? null,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,endpoint' },
  )

  if (error) {
    throw error
  }
}

export async function deletePushSubscription(
  client: BrowserSupabaseClient,
  userId: string,
  endpoint: string,
): Promise<void> {
  const { error } = await client
    .from('push_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('endpoint', endpoint)

  if (error) {
    throw error
  }
}

export async function listPushSubscriptions(
  client: BrowserSupabaseClient,
  userId: string,
): Promise<number> {
  const { count, error } = await client
    .from('push_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) {
    throw error
  }

  return count ?? 0
}

export async function getNotificationPreferences(
  client: BrowserSupabaseClient,
  userId: string,
): Promise<NotificationPreferences> {
  const { data, error } = await client
    .from('notification_preferences')
    .select(
      'user_id, member_joined, member_watched, member_rated, member_reviewed, group_ready_for_next_title, daily_countdown, last_daily_countdown_sent_on, updated_at',
    )
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    const { data: created, error: insertError } = await client
      .from('notification_preferences')
      .insert({ user_id: userId })
      .select(
        'user_id, member_joined, member_watched, member_rated, member_reviewed, group_ready_for_next_title, daily_countdown, last_daily_countdown_sent_on, updated_at',
      )
      .single()

    if (insertError) {
      throw insertError
    }

    return notificationPreferencesSchema.parse(created)
  }

  return notificationPreferencesSchema.parse(data)
}

export async function updateNotificationPreferences(
  client: BrowserSupabaseClient,
  userId: string,
  values: Partial<
    Pick<
      NotificationPreferences,
      | 'member_joined'
      | 'member_watched'
      | 'member_rated'
      | 'member_reviewed'
      | 'group_ready_for_next_title'
      | 'daily_countdown'
    >
  >,
): Promise<NotificationPreferences> {
  const { data, error } = await client
    .from('notification_preferences')
    .upsert(
      {
        user_id: userId,
        ...values,
      },
      { onConflict: 'user_id' },
    )
    .select(
      'user_id, member_joined, member_watched, member_rated, member_reviewed, group_ready_for_next_title, daily_countdown, last_daily_countdown_sent_on, updated_at',
    )
    .single()

  if (error) {
    throw error
  }

  return notificationPreferencesSchema.parse(data)
}

export async function sendTestPushNotification(
  client: BrowserSupabaseClient,
): Promise<void> {
  const { error } = await client.functions.invoke('send-push-notification', {
    body: { test: true },
  })

  if (error) {
    throw error
  }
}
