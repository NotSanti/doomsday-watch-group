import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  emitAuthEvent,
  makeProfile,
  makeSession,
  setMockProfile,
} from '@/test/supabase-mock'
import { renderApp } from '@/test/render-app'

const hasLocalPushSubscription = vi.hoisted(() => vi.fn(async () => false))
const registerPushSubscription = vi.hoisted(() =>
  vi.fn(async () => ({}) as PushSubscription),
)
const unregisterPushSubscription = vi.hoisted(() => vi.fn(async () => undefined))

vi.mock('@/features/notifications/push-utils', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/notifications/push-utils')>()
  return {
    ...actual,
    isPushSupported: () => true,
    getVapidPublicKey: () => 'test-vapid-public-key',
    hasLocalPushSubscription: () => hasLocalPushSubscription(),
  }
})

vi.mock('@/features/notifications/register-push', () => ({
  registerPushSubscription: (...args: unknown[]) =>
    registerPushSubscription(...args),
  unregisterPushSubscription: (...args: unknown[]) =>
    unregisterPushSubscription(...args),
  syncExistingPushSubscription: vi.fn(async () => false),
}))

describe('profile push notification toggle', () => {
  beforeEach(() => {
    hasLocalPushSubscription.mockResolvedValue(false)
    registerPushSubscription.mockClear()
    unregisterPushSubscription.mockClear()
    Object.defineProperty(window, 'Notification', {
      configurable: true,
      value: {
        permission: 'default',
        requestPermission: vi.fn(async () => 'granted'),
      },
    })
  })

  it('shows enable when this device is not subscribed and prompts on click', async () => {
    const user = userEvent.setup()
    setMockProfile(makeProfile({ avatar_url: 'icon:spider-man' }))
    emitAuthEvent('SIGNED_IN', makeSession())
    renderApp('/profile')

    const enable = await screen.findByRole('button', {
      name: 'Enable push notifications',
    })
    await user.click(enable)

    await waitFor(() => {
      expect(registerPushSubscription).toHaveBeenCalled()
    })
  })

  it('shows disable when this device is subscribed', async () => {
    hasLocalPushSubscription.mockResolvedValue(true)
    setMockProfile(makeProfile({ avatar_url: 'icon:spider-man' }))
    emitAuthEvent('SIGNED_IN', makeSession())
    renderApp('/profile')

    expect(
      await screen.findByRole('button', {
        name: 'Disable push notifications',
      }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Enable push notifications' }),
    ).not.toBeInTheDocument()
  })
})
