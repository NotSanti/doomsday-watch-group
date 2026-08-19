import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  makeProfile,
  makeSession,
  setMockProfile,
  setMockSession,
} from '@/test/supabase-mock'
import { openMobileNav } from '@/test/mobile-ui'
import { renderApp } from '@/test/render-app'

describe('auth route guards', () => {
  it('sends anonymous visitors from protected routes back to sign in', async () => {
    renderApp('/app')

    expect(
      await screen.findByRole('heading', { name: 'Sign in' }),
    ).toBeInTheDocument()
  })

  it('preserves the original path in returnTo', async () => {
    renderApp('/groups/demo')

    expect(
      await screen.findByRole('heading', { name: 'Sign in' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Create an account' }),
    ).toHaveAttribute('href', '/auth?mode=signup&returnTo=%2Fgroups%2Fdemo')
  })

  it('lets an onboarded member open the app shell', async () => {
    setMockSession(makeSession())
    setMockProfile(makeProfile())
    renderApp('/app')

    expect(
      await screen.findByRole('heading', { name: 'Your groups' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument()
  })

  it('gates first-time users on a display name before the app', async () => {
    setMockSession(makeSession())
    setMockProfile(makeProfile({ display_name: 'New member' }))
    renderApp('/app')

    expect(
      await screen.findByRole('heading', { name: 'Choose a display name' }),
    ).toBeInTheDocument()
  })

  it('clears the query cache on sign out', async () => {
    const user = userEvent.setup()
    setMockSession(makeSession())
    setMockProfile(makeProfile())
    const { queryClient } = renderApp('/app')

    await screen.findByRole('heading', { name: 'Your groups' })
    queryClient.setQueryData(['protected-data'], { secret: 'nope' })

    const mobileNav = await openMobileNav(user, 'App')
    await user.click(within(mobileNav).getByRole('button', { name: 'Sign out' }))

    await waitFor(() => {
      expect(queryClient.getQueryData(['protected-data'])).toBeUndefined()
    })
    expect(
      await screen.findByRole('heading', { name: 'Sign in' }),
    ).toBeInTheDocument()
  })
})
