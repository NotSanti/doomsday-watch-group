import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/Skeleton'
import type { NotificationPreferences } from '@/features/notifications/notification-schemas'
import { syncExistingPushSubscription } from '@/features/notifications/register-push'
import {
  DAILY_COUNTDOWN_SCHEDULE_LABEL,
} from '@/features/notifications/push-utils'
import {
  useNotificationPreferences,
  usePushNotificationSupport,
  usePushNotifications,
  useUpdateNotificationPreferences,
  notificationKeys,
} from '@/features/notifications/use-push-notifications'
import { getSupabaseClient } from '@/lib/supabase'

type PushNotificationsCardProps = {
  userId: string
}

const ACTIVITY_PREFERENCE_LABELS: Array<{
  key: keyof Pick<
    NotificationPreferences,
    | 'member_joined'
    | 'member_watched'
    | 'member_rated'
    | 'member_reviewed'
    | 'group_ready_for_next_title'
  >
  label: string
  description: string
}> = [
  {
    key: 'member_joined',
    label: 'Member joins',
    description: 'When someone joins one of your groups.',
  },
  {
    key: 'member_watched',
    label: 'Member watches',
    description: 'When someone marks a title as watched.',
  },
  {
    key: 'member_rated',
    label: 'Member rates',
    description: 'When someone saves a rating.',
  },
  {
    key: 'member_reviewed',
    label: 'Member reviews',
    description: 'When someone publishes review text.',
  },
  {
    key: 'group_ready_for_next_title',
    label: 'Next group title',
    description: 'When everyone finishes the current title.',
  },
]

export function PushNotificationsCard({ userId }: PushNotificationsCardProps) {
  const support = usePushNotificationSupport()
  const queryClient = useQueryClient()
  const preferencesQuery = useNotificationPreferences(userId)
  const updatePreferences = useUpdateNotificationPreferences(userId)
  const push = usePushNotifications(userId)

  useEffect(() => {
    if (!support.supported || !support.configured) {
      return
    }

    void syncExistingPushSubscription(getSupabaseClient(), userId).then(
      (synced) => {
        if (synced) {
          void queryClient.invalidateQueries({
            queryKey: notificationKeys.subscriptions(userId),
          })
        }
      },
    )
  }, [queryClient, support.configured, support.supported, userId])

  if (preferencesQuery.isPending || push.isLoading) {
    return <Skeleton className="h-40 w-full" />
  }

  if (preferencesQuery.isError || !preferencesQuery.data) {
    return (
      <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-3 text-sm text-heading">
        Notification settings could not be loaded.
      </div>
    )
  }

  const permission =
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  const canUsePush = support.supported && support.configured
  const dailyEnabled = preferencesQuery.data.daily_countdown

  return (
    <div className="space-y-4 rounded-md border border-border bg-surface px-3 py-4">
      <div>
        <h2 className="font-display text-lg tracking-[0.08em] text-heading uppercase">
          Push notifications
        </h2>
        <p className="mt-1 text-sm text-muted">
          Install the app on your phone for the best experience. On iPhone, add
          the site to your Home Screen before enabling notifications.
        </p>
      </div>

      <label className="flex items-start gap-3 rounded-md border border-border/70 px-3 py-3">
        <input
          type="checkbox"
          className="mt-1 size-4 accent-primary-emphasis"
          checked={dailyEnabled}
          disabled={updatePreferences.isPending || push.subscribe.isPending}
          aria-describedby="daily-countdown-help"
          onChange={(event) => {
            const enabled = event.target.checked
            void (async () => {
              await updatePreferences.mutateAsync({
                daily_countdown: enabled,
              })

              if (enabled && canUsePush && !push.isSubscribed) {
                await push.subscribe.mutateAsync()
              }
            })()
          }}
        />
        <span>
          <span className="block text-sm text-heading">
            Daily Doomsday countdown
          </span>
          <span
            id="daily-countdown-help"
            className="mt-1 block text-xs text-muted"
          >
            {dailyEnabled
              ? `On. You will get a reminder ${DAILY_COUNTDOWN_SCHEDULE_LABEL} with days remaining.`
              : `Off by default. Turn this on to receive one reminder each day ${DAILY_COUNTDOWN_SCHEDULE_LABEL}.`}
          </span>
        </span>
      </label>

      {!support.supported ? (
        <p className="text-sm text-muted">
          This browser cannot receive push notifications. Enable the daily
          reminder here, then open Profile on a phone or desktop that supports
          push.
        </p>
      ) : null}

      {!support.supported ? null : !support.configured ? (
        <p className="text-sm text-muted">
          Push delivery is not configured for this environment yet. You can
          still save the daily reminder setting.
        </p>
      ) : (
        <>
          {permission === 'denied' ? (
            <p className="text-sm text-secondary" role="status">
              Notifications are blocked in your browser settings. Enable them
              there, then return to this page.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {push.isSubscribed ? (
              <Button
                type="button"
                variant="secondary"
                disabled={push.unsubscribe.isPending}
                onClick={() => {
                  void push.unsubscribe.mutateAsync()
                }}
              >
                {push.unsubscribe.isPending
                  ? 'Disabling…'
                  : 'Disable on this device'}
              </Button>
            ) : (
              <Button
                type="button"
                disabled={push.subscribe.isPending || permission === 'denied'}
                onClick={() => {
                  void push.subscribe.mutateAsync()
                }}
              >
                {push.subscribe.isPending
                  ? 'Enabling…'
                  : 'Enable on this device'}
              </Button>
            )}
            {push.isSubscribed ? (
              <Button
                type="button"
                variant="secondary"
                disabled={push.test.isPending}
                onClick={() => {
                  void push.test.mutateAsync()
                }}
              >
                {push.test.isPending ? 'Sending…' : 'Send test notification'}
              </Button>
            ) : null}
          </div>

          {push.isSubscribed ? (
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-secondary">
                Group activity
              </legend>
              {ACTIVITY_PREFERENCE_LABELS.map((item) => (
                <label
                  key={item.key}
                  className="flex items-start gap-3 rounded-md border border-border/70 px-3 py-2"
                >
                  <input
                    type="checkbox"
                    className="mt-1 size-4 accent-primary-emphasis"
                    checked={preferencesQuery.data[item.key]}
                    disabled={updatePreferences.isPending}
                    onChange={(event) => {
                      void updatePreferences.mutateAsync({
                        [item.key]: event.target.checked,
                      })
                    }}
                  />
                  <span>
                    <span className="block text-sm text-heading">
                      {item.label}
                    </span>
                    <span className="block text-xs text-muted">
                      {item.description}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>
          ) : (
            <p className="text-sm text-muted">
              Enable notifications on this device to also get group activity
              alerts (joins, watches, ratings, and reviews).
            </p>
          )}
        </>
      )}
    </div>
  )
}
