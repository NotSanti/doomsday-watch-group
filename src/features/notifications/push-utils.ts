export const DOOMSDAY_PUSH_TARGET_ISO = '2026-12-18T00:00:00-05:00'

/** Cron is `0 14 * * *` UTC — 10:00 AM Eastern in summer, 9:00 AM in winter. */
export const DAILY_COUNTDOWN_SCHEDULE_LABEL =
  'around 10:00 AM Eastern (2:00 PM UTC)'

export function countdownDaysUntil(target: Date, now: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000
  const diff = target.getTime() - now.getTime()

  if (diff <= 0) {
    return 0
  }

  return Math.ceil(diff / msPerDay)
}

export function dailyCountdownMessage(now: Date, target: Date): {
  title: string
  body: string
} | null {
  const days = countdownDaysUntil(target, now)

  if (days <= 0) {
    return null
  }

  const dayLabel = days === 1 ? 'day' : 'days'

  return {
    title: 'Road to Doomsday',
    body: `${String(days)} ${dayLabel} until Doomsday.`,
  }
}

export function parsePushPayload(payload: Record<string, unknown>): {
  title: string
  body: string
  url: string
} {
  const title =
    typeof payload.title === 'string' && payload.title.trim()
      ? payload.title
      : 'Doom Watch Party'
  const body =
    typeof payload.body === 'string' && payload.body.trim()
      ? payload.body
      : 'You have a new update from your watch group.'
  const url =
    typeof payload.url === 'string' && payload.url.trim() ? payload.url : '/'

  return { title, body, url }
}

export function getVapidPublicKey(): string | null {
  const key = import.meta.env.VITE_VAPID_PUBLIC_KEY

  if (typeof key !== 'string') {
    return null
  }

  const trimmed = key.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  // iOS Safari uses `navigator.standalone` for installed web apps.
  const iOSStandalone =
    'standalone' in navigator
      ? Boolean(
          (navigator as Navigator & { standalone?: boolean }).standalone,
        )
      : false

  // Most modern browsers expose this via `display-mode`.
  const displayModeStandalone =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches

  return Boolean(iOSStandalone || displayModeStandalone)
}

export function urlBase64ToUint8Array(value: string): Uint8Array {
  const padding = '='.repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const buffer = new ArrayBuffer(raw.length)
  const output = new Uint8Array(buffer)

  for (let index = 0; index < raw.length; index += 1) {
    output[index] = raw.charCodeAt(index)
  }

  return output
}
