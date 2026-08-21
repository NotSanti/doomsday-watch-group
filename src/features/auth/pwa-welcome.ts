import type { AuthStatus } from '@/features/auth/auth-context'

/** Full-screen Register / Log in gate for installed PWA launches. */
export function shouldShowPwaWelcomeGate(input: {
  isStandalone: boolean
  authStatus: AuthStatus
}): boolean {
  return input.isStandalone && input.authStatus !== 'authenticated'
}

/** Signed-in PWA launches should land in the app, not the marketing home. */
export function shouldRedirectPwaHomeToApp(input: {
  isStandalone: boolean
  authStatus: AuthStatus
}): boolean {
  return input.isStandalone && input.authStatus === 'authenticated'
}
