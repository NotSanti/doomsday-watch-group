import type { AuthStatus } from '@/features/auth/auth-context'

/** Full-screen Register / Log in gate for installed PWA launches. */
export function shouldShowPwaWelcomeGate(input: {
  isStandalone: boolean
  authStatus: AuthStatus
}): boolean {
  return input.isStandalone && input.authStatus !== 'authenticated'
}
