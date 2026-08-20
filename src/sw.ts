/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from 'workbox-precaching'

declare let self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)
clientsClaim()

type PushPayload = {
  title?: string
  body?: string
  url?: string
}

function parsePushPayload(data: PushEvent['data']): PushPayload {
  if (!data) {
    return {}
  }

  try {
    return data.json() as PushPayload
  } catch {
    const text = data.text()
    return text ? { body: text } : {}
  }
}

self.addEventListener('push', (event) => {
  const payload = parsePushPayload(event.data)
  const title = payload.title ?? 'Doom Watch Party'
  const options: NotificationOptions = {
    body: payload.body ?? 'You have a new update from your watch group.',
    icon: '/doomWatchPartyLogo.svg',
    badge: '/doomWatchPartyLogo.svg',
    data: { url: payload.url ?? '/' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url =
    typeof event.notification.data?.url === 'string'
      ? event.notification.data.url
      : '/'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ('focus' in client && client.url.includes(self.location.origin)) {
            void client.focus()
            if ('navigate' in client) {
              void client.navigate(url)
            }
            return
          }
        }

        void self.clients.openWindow(url)
      }),
  )
})

export {}
