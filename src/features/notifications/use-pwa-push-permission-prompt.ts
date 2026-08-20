import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getPwaPushPermissionAction } from '@/features/notifications/pwa-push-permission'
import { registerPushSubscription } from '@/features/notifications/register-push'
import { notificationKeys } from '@/features/notifications/use-push-notifications'
import { getSupabaseClient } from '@/lib/supabase'

/**
 * On PWA sign-in: if notification permission was never decided, ask once.
 * If already granted, ensure this device is subscribed. If denied, stay quiet.
 * Independent of Daily Doomsday countdown or other preference toggles.
 */
export function usePwaPushPermissionPrompt(userId: string | undefined) {
  const queryClient = useQueryClient()
  const attemptedForUser = useRef<string | null>(null)

  useEffect(() => {
    if (!userId) {
      attemptedForUser.current = null
      return
    }

    if (attemptedForUser.current === userId) {
      return
    }

    if (getPwaPushPermissionAction() !== 'request') {
      attemptedForUser.current = userId
      return
    }

    attemptedForUser.current = userId

    void registerPushSubscription(getSupabaseClient(), userId)
      .then(() => {
        void queryClient.invalidateQueries({
          queryKey: notificationKeys.subscriptions(userId),
        })
      })
      .catch(() => {
        // Denied / dismissed / unsupported — stay silent on the auto path.
      })
  }, [queryClient, userId])
}
