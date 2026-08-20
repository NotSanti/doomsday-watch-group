import { describe, expect, it } from 'vitest'
import { shouldShowPwaWelcomeGate } from '@/features/auth/pwa-welcome'

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
