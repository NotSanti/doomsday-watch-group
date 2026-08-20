import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import {
  isNotificationEnabled,
  normalizeEnvSecret,
} from '../_shared/push-payload.ts'
import {
  configureWebPush,
  loadWebPushConfig,
  sendWebPush,
} from '../_shared/web-push.ts'

const DOOMSDAY_TARGET_ISO = '2026-12-18T00:00:00-05:00'

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function verifyInternalSecret(request: Request): boolean {
  const expected = normalizeEnvSecret(Deno.env.get('PUSH_INTERNAL_SECRET'))
  const provided = request.headers.get('X-Push-Internal-Secret')?.trim()

  return Boolean(expected && provided && expected === provided)
}

function countdownDaysUntil(target: Date, now: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000
  const diff = target.getTime() - now.getTime()

  if (diff <= 0) {
    return 0
  }

  return Math.ceil(diff / msPerDay)
}

function getServiceClient() {
  const url = normalizeEnvSecret(Deno.env.get('SUPABASE_URL'))
  const serviceRoleKey = normalizeEnvSecret(
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
  )

  if (!url || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10)
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  if (!verifyInternalSecret(request)) {
    return jsonResponse({ error: 'Forbidden.' }, 403)
  }

  const now = new Date()
  const target = new Date(DOOMSDAY_TARGET_ISO)
  const days = countdownDaysUntil(target, now)

  if (days <= 0) {
    return jsonResponse({ ok: true, skipped: true, reason: 'elapsed' })
  }

  const dayLabel = days === 1 ? 'day' : 'days'
  const payload = {
    title: 'Road to Doomsday',
    body: `${String(days)} ${dayLabel} until Doomsday.`,
    url: '/',
  }

  const client = getServiceClient()
  const today = todayUtcDate()

  const { data: preferences, error: preferencesError } = await client
    .from('notification_preferences')
    .select(
      'user_id, member_joined, member_watched, member_rated, member_reviewed, group_ready_for_next_title, daily_countdown, last_daily_countdown_sent_on',
    )
    .eq('daily_countdown', true)
    .or(`last_daily_countdown_sent_on.is.null,last_daily_countdown_sent_on.neq.${today}`)

  if (preferencesError) {
    return jsonResponse({ error: preferencesError.message }, 500)
  }

  configureWebPush(loadWebPushConfig())

  let usersSent = 0
  let pushesSent = 0
  let expired = 0

  for (const preference of preferences ?? []) {
    if (!isNotificationEnabled(preference, 'daily_countdown')) {
      continue
    }

    const { data: subscriptions, error: subscriptionsError } = await client
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', preference.user_id)

    if (subscriptionsError || !subscriptions?.length) {
      continue
    }

    let delivered = false

    for (const subscription of subscriptions) {
      const result = await sendWebPush(subscription, payload)

      if (result.expired) {
        expired += 1
        await client.from('push_subscriptions').delete().eq('id', subscription.id)
      } else {
        pushesSent += 1
        delivered = true
      }
    }

    if (delivered) {
      usersSent += 1
      await client
        .from('notification_preferences')
        .update({ last_daily_countdown_sent_on: today })
        .eq('user_id', preference.user_id)
    }
  }

  return jsonResponse({
    ok: true,
    users_sent: usersSent,
    pushes_sent: pushesSent,
    expired,
  })
})
