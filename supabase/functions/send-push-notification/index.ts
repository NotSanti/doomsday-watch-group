import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import {
  isNotificationEnabled,
  normalizeEnvSecret,
  parsePushPayload,
  type NotificationType,
} from '../_shared/push-payload.ts'
import {
  configureWebPush,
  loadWebPushConfig,
  sendWebPush,
} from '../_shared/web-push.ts'

type SendPushBody = {
  outbox_id?: number
  test?: boolean
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
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

function verifyInternalSecret(request: Request): boolean {
  const expected = normalizeEnvSecret(Deno.env.get('PUSH_INTERNAL_SECRET'))
  const provided = request.headers.get('X-Push-Internal-Secret')?.trim()

  return Boolean(expected && provided && expected === provided)
}

async function getUserIdFromAuthHeader(
  request: Request,
): Promise<string | null> {
  const authorization = request.headers.get('Authorization')

  if (!authorization?.startsWith('Bearer ')) {
    return null
  }

  const token = authorization.slice('Bearer '.length).trim()
  const url = normalizeEnvSecret(Deno.env.get('SUPABASE_URL'))
  const anonKey = normalizeEnvSecret(Deno.env.get('SUPABASE_ANON_KEY'))

  if (!url || !anonKey || !token) {
    return null
  }

  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await client.auth.getUser(token)

  if (error || !data.user) {
    return null
  }

  return data.user.id
}

async function deliverToUser(
  userId: string,
  payload: Record<string, unknown>,
  notificationType: string,
): Promise<{ sent: number; expired: number; skipped: boolean }> {
  const client = getServiceClient()
  const { data: preferences, error: preferencesError } = await client
    .from('notification_preferences')
    .select(
      'member_joined, member_watched, member_rated, member_reviewed, group_ready_for_next_title, daily_countdown',
    )
    .eq('user_id', userId)
    .maybeSingle()

  if (preferencesError) {
    throw preferencesError
  }

  if (
    preferences &&
    !isNotificationEnabled(preferences, notificationType as NotificationType)
  ) {
    return { sent: 0, expired: 0, skipped: true }
  }

  const { data: subscriptions, error: subscriptionsError } = await client
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (subscriptionsError) {
    throw subscriptionsError
  }

  if (!subscriptions?.length) {
    return { sent: 0, expired: 0, skipped: true }
  }

  configureWebPush(loadWebPushConfig())

  let sent = 0
  let expired = 0

  for (const subscription of subscriptions) {
    const result = await sendWebPush(subscription, payload)

    if (result.expired) {
      expired += 1
      await client
        .from('push_subscriptions')
        .delete()
        .eq('id', subscription.id)
    } else {
      sent += 1
    }
  }

  return { sent, expired, skipped: false }
}

async function handleOutbox(outboxId: number): Promise<Response> {
  const client = getServiceClient()
  const { data: row, error } = await client
    .from('notification_outbox')
    .select('id, notification_type, recipient_id, payload, status')
    .eq('id', outboxId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!row) {
    return jsonResponse({ error: 'Outbox row not found.' }, 404)
  }

  if (row.status !== 'pending') {
    return jsonResponse({ ok: true, skipped: true })
  }

  const payload =
    typeof row.payload === 'object' && row.payload !== null
      ? (row.payload as Record<string, unknown>)
      : {}

  try {
    const result = await deliverToUser(
      row.recipient_id,
      payload,
      row.notification_type,
    )

    await client
      .from('notification_outbox')
      .update({
        status: result.skipped && result.sent === 0 ? 'sent' : 'sent',
        sent_at: new Date().toISOString(),
        error: result.skipped ? 'No active subscriptions or disabled preference.' : null,
      })
      .eq('id', outboxId)

    return jsonResponse({ ok: true, ...result })
  } catch (deliveryError) {
    const message =
      deliveryError instanceof Error
        ? deliveryError.message
        : 'Push delivery failed.'

    await client
      .from('notification_outbox')
      .update({ status: 'failed', error: message })
      .eq('id', outboxId)

    return jsonResponse({ error: message }, 500)
  }
}

async function handleTest(userId: string): Promise<Response> {
  const payload = parsePushPayload({
    title: 'Notifications are working',
    body: 'Doomsday Watch Group can reach this device.',
    url: '/profile',
  })

  const result = await deliverToUser(userId, payload, 'test')
  return jsonResponse({ ok: true, ...result })
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  let body: SendPushBody

  try {
    body = (await request.json()) as SendPushBody
  } catch {
    return jsonResponse({ error: 'Invalid JSON body.' }, 400)
  }

  try {
    if (body.test) {
      const userId = await getUserIdFromAuthHeader(request)

      if (!userId) {
        return jsonResponse({ error: 'Unauthorized.' }, 401)
      }

      return await handleTest(userId)
    }

    if (!verifyInternalSecret(request)) {
      return jsonResponse({ error: 'Forbidden.' }, 403)
    }

    if (!body.outbox_id) {
      return jsonResponse({ error: 'Missing outbox_id.' }, 400)
    }

    return await handleOutbox(body.outbox_id)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.'
    return jsonResponse({ error: message }, 500)
  }
})
