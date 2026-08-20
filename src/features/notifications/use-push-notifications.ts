import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getNotificationPreferences,
  listPushSubscriptions,
  sendTestPushNotification,
  updateNotificationPreferences,
} from '@/features/notifications/notification-api'
import type { NotificationPreferences } from '@/features/notifications/notification-schemas'
import {
  registerPushSubscription,
  syncExistingPushSubscription,
  unregisterPushSubscription,
} from '@/features/notifications/register-push'
import {
  getVapidPublicKey,
  isPushSupported,
} from '@/features/notifications/push-utils'
import { getSupabaseClient } from '@/lib/supabase'

export const notificationKeys = {
  all: ['notifications'] as const,
  preferences: (userId: string) =>
    [...notificationKeys.all, 'preferences', userId] as const,
  subscriptions: (userId: string) =>
    [...notificationKeys.all, 'subscriptions', userId] as const,
}

export function usePushNotificationSupport() {
  return {
    supported: isPushSupported(),
    configured: Boolean(getVapidPublicKey()),
  }
}

export function useNotificationPreferences(userId: string | undefined) {
  return useQuery({
    queryKey: notificationKeys.preferences(userId ?? ''),
    queryFn: () => getNotificationPreferences(getSupabaseClient(), userId!),
    enabled: Boolean(userId),
  })
}

export function usePushSubscriptionCount(userId: string | undefined) {
  return useQuery({
    queryKey: notificationKeys.subscriptions(userId ?? ''),
    queryFn: () => listPushSubscriptions(getSupabaseClient(), userId!),
    enabled: Boolean(userId),
  })
}

export function usePushNotifications(userId: string | undefined) {
  const queryClient = useQueryClient()
  const subscriptionsQuery = usePushSubscriptionCount(userId)

  const subscribe = useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error('Sign in to enable notifications.')
      }

      return registerPushSubscription(getSupabaseClient(), userId)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationKeys.subscriptions(userId ?? ''),
      })
      toast.success('Notifications enabled on this device')
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Notifications could not be enabled.',
      )
    },
  })

  const unsubscribe = useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error('Sign in to manage notifications.')
      }

      await unregisterPushSubscription(getSupabaseClient(), userId)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: notificationKeys.subscriptions(userId ?? ''),
      })
      toast.success('Notifications disabled on this device')
    },
    onError: () => {
      toast.error('Notifications could not be disabled.')
    },
  })

  const sync = useMutation({
    mutationFn: async () => {
      if (!userId) {
        return false
      }

      return syncExistingPushSubscription(getSupabaseClient(), userId)
    },
    onSuccess: (synced) => {
      if (synced) {
        void queryClient.invalidateQueries({
          queryKey: notificationKeys.subscriptions(userId ?? ''),
        })
      }
    },
  })

  const test = useMutation({
    mutationFn: () => sendTestPushNotification(getSupabaseClient()),
    onSuccess: () => {
      toast.success('Test notification sent')
    },
    onError: () => {
      toast.error('Test notification could not be sent.')
    },
  })

  return {
    subscriptionCount: subscriptionsQuery.data ?? 0,
    isSubscribed: (subscriptionsQuery.data ?? 0) > 0,
    isLoading: subscriptionsQuery.isLoading,
    subscribe,
    unsubscribe,
    sync,
    test,
  }
}

export function useUpdateNotificationPreferences(userId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
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
    ) => updateNotificationPreferences(getSupabaseClient(), userId!, values),
    onSuccess: (data, values) => {
      queryClient.setQueryData(notificationKeys.preferences(userId ?? ''), data)
      if (values.daily_countdown === true) {
        toast.success('Daily Doomsday countdown enabled')
      } else if (values.daily_countdown === false) {
        toast.success('Daily Doomsday countdown turned off')
      }
    },
    onError: () => {
      toast.error('Notification preferences could not be saved.')
    },
  })
}
