import webpush from 'npm:web-push@3.6.7'
import {
  normalizeEnvSecret,
  parsePushPayload,
  type StoredPushSubscription,
} from './push-payload.ts'

export type WebPushConfig = {
  publicKey: string
  privateKey: string
  subject: string
}

export function loadWebPushConfig(): WebPushConfig {
  const publicKey = normalizeEnvSecret(Deno.env.get('VAPID_PUBLIC_KEY'))
  const privateKey = normalizeEnvSecret(Deno.env.get('VAPID_PRIVATE_KEY'))
  const subject = normalizeEnvSecret(Deno.env.get('VAPID_SUBJECT'))

  if (!publicKey || !privateKey || !subject) {
    throw new Error(
      'Missing VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, or VAPID_SUBJECT.',
    )
  }

  return { publicKey, privateKey, subject }
}

export function configureWebPush(config: WebPushConfig): void {
  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey)
}

export async function sendWebPush(
  subscription: StoredPushSubscription,
  payload: Record<string, unknown>,
): Promise<{ expired: boolean }> {
  const message = parsePushPayload(payload)

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(message),
    )

    return { expired: false }
  } catch (error) {
    const statusCode =
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      typeof error.statusCode === 'number'
        ? error.statusCode
        : null

    if (statusCode === 404 || statusCode === 410) {
      return { expired: true }
    }

    throw error
  }
}
