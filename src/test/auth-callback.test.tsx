import { screen, waitFor } from '@testing-library/react'
import {
  makeProfile,
  setMockProfile,
  supabaseAuthMock,
} from '@/test/supabase-mock'
import { renderApp } from '@/test/render-app'

describe('auth email callback', () => {
  it('exchanges token_hash on /auth/callback and enters the app', async () => {
    setMockProfile(makeProfile())
    renderApp('/auth/callback?token_hash=abc123&type=signup')

    await waitFor(() => {
      expect(supabaseAuthMock.verifyOtp).toHaveBeenCalledWith({
        token_hash: 'abc123',
        type: 'signup',
      })
    })

    expect(
      await screen.findByRole('heading', { name: 'Your groups' }),
    ).toBeInTheDocument()
  })

  it('forwards Site URL links with token_hash to the auth callback', async () => {
    setMockProfile(makeProfile())
    renderApp('/?token_hash=from-home&type=signup')

    await waitFor(() => {
      expect(supabaseAuthMock.verifyOtp).toHaveBeenCalledWith({
        token_hash: 'from-home',
        type: 'signup',
      })
    })

    expect(
      await screen.findByRole('heading', { name: 'Your groups' }),
    ).toBeInTheDocument()
  })
})
