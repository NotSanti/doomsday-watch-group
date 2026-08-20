import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  emitAuthEvent,
  makeProfile,
  makeSession,
  setMockProfile,
  supabaseAuthMock,
} from '@/test/supabase-mock'
import { renderApp } from '@/test/render-app'

describe('auth forms', () => {
  it('shows validation errors before calling Supabase', async () => {
    const user = userEvent.setup()
    renderApp('/auth')

    await screen.findByRole('heading', { name: 'Sign in' })
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(
      await screen.findByText('Enter a valid email address.'),
    ).toBeInTheDocument()
    expect(supabaseAuthMock.signInWithPassword).not.toHaveBeenCalled()
  })

  it('shows a friendly message for invalid credentials', async () => {
    const user = userEvent.setup()
    supabaseAuthMock.signInWithPassword.mockResolvedValueOnce({
      data: { session: null, user: null },
      error: {
        code: 'invalid_credentials',
        message: 'Invalid login credentials',
      },
    })
    renderApp('/auth')

    await screen.findByRole('heading', { name: 'Sign in' })
    await user.type(screen.getByLabelText('Email'), 'owner@example.test')
    await user.type(screen.getByLabelText('Password'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(
      await screen.findByText('That email or password is incorrect.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Invalid login credentials'),
    ).not.toBeInTheDocument()
  })

  it('enters the app after a successful sign in', async () => {
    const user = userEvent.setup()
    const session = makeSession()
    const profile = makeProfile()
    supabaseAuthMock.signInWithPassword.mockImplementation(async () => {
      setMockProfile(profile)
      emitAuthEvent('SIGNED_IN', session)
      return { data: { session, user: session.user }, error: null }
    })
    renderApp('/auth')

    await screen.findByRole('heading', { name: 'Sign in' })
    await user.type(screen.getByLabelText('Email'), 'owner@example.test')
    await user.type(screen.getByLabelText('Password'), 'password1')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(
      await screen.findByRole('heading', { name: 'Your groups' }),
    ).toBeInTheDocument()
  })

  it('saves a first-time display name and continues', async () => {
    const user = userEvent.setup()
    setMockProfile(makeProfile({ display_name: 'New member' }))
    emitAuthEvent('SIGNED_IN', makeSession())
    renderApp('/profile?onboarding=1&returnTo=%2Fapp')

    expect(
      await screen.findByRole('heading', { name: 'Choose a display name' }),
    ).toBeInTheDocument()

    await user.type(screen.getByLabelText('Display name'), 'Santi')
    await user.click(screen.getByRole('button', { name: 'Save display name' }))

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Your groups' }),
      ).toBeInTheDocument()
    })
  })

  it('asks for a profile icon after email confirmation', async () => {
    const user = userEvent.setup()
    setMockProfile(makeProfile({ avatar_url: null }))
    emitAuthEvent('SIGNED_IN', makeSession())
    renderApp('/app')

    expect(
      await screen.findByRole('heading', { name: 'Last step' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Save icon' }),
    ).toBeDisabled()

    await user.click(screen.getByRole('radio', { name: 'Iron Man' }))
    await user.click(screen.getByRole('button', { name: 'Save icon' }))

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { name: 'Last step' }),
      ).not.toBeInTheDocument()
    })
    expect(
      screen.getByRole('heading', { name: 'Your groups' }),
    ).toBeInTheDocument()
  })

  it('shows the saved profile icon on the profile page', async () => {
    setMockProfile(makeProfile({ avatar_url: 'icon:spider-man' }))
    emitAuthEvent('SIGNED_IN', makeSession())
    renderApp('/profile')

    expect(
      await screen.findByRole('heading', { name: 'Profile' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Your profile icon' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Spider Man' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })

  it('lets a member opt in to the daily Doomsday countdown', async () => {
    const user = userEvent.setup()
    setMockProfile(makeProfile({ avatar_url: 'icon:spider-man' }))
    emitAuthEvent('SIGNED_IN', makeSession())
    renderApp('/profile')

    const toggle = await screen.findByRole('checkbox', {
      name: /Daily Doomsday countdown/,
    })
    expect(toggle).not.toBeChecked()
    expect(
      screen.getByText(/Off by default/i),
    ).toBeInTheDocument()

    await user.click(toggle)

    await waitFor(() => {
      expect(toggle).toBeChecked()
    })
    expect(
      screen.getByText(/You will get a reminder around 10:00 AM Eastern/i),
    ).toBeInTheDocument()
  })
})
