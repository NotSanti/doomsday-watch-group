import {
  deletePushSubscription,
  upsertPushSubscription,
} from '@/features/notifications/notification-api'
import {
  getVapidPublicKey,
  urlBase64ToUint8Array,
} from '@/features/notifications/push-utils'
import type { PushSubscriptionInput } from '@/features/notifications/notification-schemas'
import type { BrowserSupabaseClient } from '@/lib/supabase'

function subscriptionInput(
  subscription: PushSubscription,
): PushSubscriptionInput {
  const json = subscription.toJSON()

  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
    throw new Error('Push subscription is missing required keys.')
  }

  return {
    endpoint: json.endpoint,
    keys: {
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
    user_agent: navigator.userAgent,
  }
}

export async function registerPushSubscription(
  client: BrowserSupabaseClient,
  userId: string,
): Promise<PushSubscription> {
  const vapidPublicKey = getVapidPublicKey()

  if (!vapidPublicKey) {
    throw new Error(
      'Push notifications are not configured for this environment.',
    )
  }

  const permission = await Notification.requestPermission()

  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.')
  }

  const registration = await navigator.serviceWorker.ready
  let subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    })
  }

  await upsertPushSubscription(client, userId, subscriptionInput(subscription))

  return subscription
}

export async function unregisterPushSubscription(
  client: BrowserSupabaseClient,
  userId: string,
): Promise<void> {
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()

  if (subscription) {
    await deletePushSubscription(client, userId, subscription.endpoint)
    await subscription.unsubscribe()
  }
}

export async function syncExistingPushSubscription(
  client: BrowserSupabaseClient,
  userId: string,
): Promise<boolean> {
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    return false
  }

  await upsertPushSubscription(client, userId, subscriptionInput(subscription))
  return true
}
