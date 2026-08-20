import {
  getVapidPublicKey,
  isPushSupported,
  isStandalonePwa,
} from '@/features/notifications/push-utils'

export type PwaPushPermissionAction = 'request' | 'skip'

/**
 * Decide whether the installed PWA should request notification access.
 * Prefers browser permission state over preference toggles or other devices.
 */
export function getPwaPushPermissionAction(
  input: {
    isStandalone?: boolean
    supported?: boolean
    configured?: boolean
    permission?: NotificationPermission
  } = {},
): PwaPushPermissionAction {
  const isStandalone = input.isStandalone ?? isStandalonePwa()
  const supported = input.supported ?? isPushSupported()
  const configured = input.configured ?? Boolean(getVapidPublicKey())
  const permission =
    input.permission ??
    (typeof Notification !== 'undefined' ? Notification.permission : 'denied')

  if (!isStandalone || !supported || !configured) {
    return 'skip'
  }

  // Explicit block: never re-prompt.
  if (permission === 'denied') {
    return 'skip'
  }

  // `default` → show the system dialog.
  // `granted` → ensure this device is subscribed (no dialog).
  return 'request'
}
