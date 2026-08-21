import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  makeProfile,
  makeSession,
  setMockProfile,
  setMockSession,
} from '@/test/supabase-mock'
import { openMobileNav } from '@/test/mobile-ui'
import { renderApp } from '@/test/render-app'

const isStandalonePwa = vi.hoisted(() => vi.fn(() => false))

vi.mock('@/features/notifications/push-utils', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/features/notifications/push-utils')>()
  return {
    ...actual,
    isStandalonePwa: () => isStandalonePwa(),
  }
})

describe('PWA welcome gate', () => {
  beforeEach(() => {
    isStandalonePwa.mockReturnValue(false)
  })

  it('keeps the marketing landing page outside standalone PWA', async () => {
    renderApp('/')

    expect(
      await screen.findByRole('heading', {
        name: /watch together on the road to doomsday/i,
      }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: /welcome to doom watch party/i }),
    ).not.toBeInTheDocument()
  })

  it('replaces the landing page with register and log in in standalone PWA', async () => {
    isStandalonePwa.mockReturnValue(true)
    renderApp('/')

    expect(
      await screen.findByRole('heading', {
        name: /welcome to doom watch party/i,
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Register' })).toHaveAttribute(
      'href',
      '/auth?mode=signup&returnTo=%2Fapp',
    )
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute(
      'href',
      '/auth?returnTo=%2Fapp',
    )
    expect(
      screen.queryByRole('heading', {
        name: /watch together on the road to doomsday/i,
      }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('banner')).not.toBeInTheDocument()
  })

  it('shows the app version in the PWA hamburger menu', async () => {
    isStandalonePwa.mockReturnValue(true)
    setMockSession(makeSession())
    setMockProfile(makeProfile())
    const user = userEvent.setup()
    renderApp('/app')

    await screen.findByRole('heading', { name: 'Your groups' })
    expect(screen.queryByText(/^v0\.1\.0/)).not.toBeInTheDocument()

    const mobileNav = await openMobileNav(user, 'App')
    expect(within(mobileNav).getByText(/^v0\.1\.0/)).toBeInTheDocument()
  })
})
