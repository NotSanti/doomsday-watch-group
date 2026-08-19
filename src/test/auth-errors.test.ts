import { toFriendlyAuthError } from '@/features/auth/auth-errors'

describe('toFriendlyAuthError', () => {
  it('maps known auth codes without exposing backend text', () => {
    expect(
      toFriendlyAuthError({
        code: 'invalid_credentials',
        message: 'Invalid login credentials',
      }),
    ).toBe('That email or password is incorrect.')
  })

  it('uses a generic fallback for unknown errors', () => {
    expect(
      toFriendlyAuthError({
        message: 'column profiles.secret does not exist',
      }),
    ).toBe('Something went wrong. Please try again.')
  })
})
