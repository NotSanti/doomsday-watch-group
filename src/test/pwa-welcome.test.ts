import {
  shouldRedirectPwaHomeToApp,
  shouldShowPwaWelcomeGate,
} from '@/features/auth/pwa-welcome'

describe('shouldShowPwaWelcomeGate', () => {
  it('shows for anonymous users in a standalone PWA', () => {
    expect(
      shouldShowPwaWelcomeGate({
        isStandalone: true,
        authStatus: 'anonymous',
      }),
    ).toBe(true)
  })

  it('shows while auth is still loading in a standalone PWA', () => {
    expect(
      shouldShowPwaWelcomeGate({
        isStandalone: true,
        authStatus: 'loading',
      }),
    ).toBe(true)
  })

  it('hides for authenticated users even in a standalone PWA', () => {
    expect(
      shouldShowPwaWelcomeGate({
        isStandalone: true,
        authStatus: 'authenticated',
      }),
    ).toBe(false)
  })

  it('hides outside standalone PWA', () => {
    expect(
      shouldShowPwaWelcomeGate({
        isStandalone: false,
        authStatus: 'anonymous',
      }),
    ).toBe(false)
  })
})

describe('shouldRedirectPwaHomeToApp', () => {
  it('redirects signed-in standalone PWA users to /app', () => {
    expect(
      shouldRedirectPwaHomeToApp({
        isStandalone: true,
        authStatus: 'authenticated',
      }),
    ).toBe(true)
  })

  it('does not redirect anonymous or browser users', () => {
    expect(
      shouldRedirectPwaHomeToApp({
        isStandalone: true,
        authStatus: 'anonymous',
      }),
    ).toBe(false)
    expect(
      shouldRedirectPwaHomeToApp({
        isStandalone: false,
        authStatus: 'authenticated',
      }),
    ).toBe(false)
  })
})
