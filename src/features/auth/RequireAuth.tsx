import { Navigate, Outlet, useLocation } from 'react-router'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { ChooseAvatarOverlay } from '@/features/auth/ChooseAvatarOverlay'
import { useAuth } from '@/features/auth/use-auth'

function isProfilePath(pathname: string): boolean {
  return pathname === '/profile' || /^\/groups\/[^/]+\/profile\/?$/.test(pathname)
}

function GuardSkeleton() {
  return (
    <div
      className="mx-auto max-w-6xl px-4 py-16"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading your session</span>
      <Skeleton className="h-10 w-48" />
      <Skeleton className="mt-6 h-40 w-full" />
    </div>
  )
}

export function RequireAuth() {
  const {
    status,
    needsOnboarding,
    needsAvatarOnboarding,
    profileStatus,
    profileError,
    refreshProfile,
  } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <GuardSkeleton />
  }

  if (status === 'anonymous') {
    const returnTo = `${location.pathname}${location.search}`
    return (
      <Navigate to={`/auth?returnTo=${encodeURIComponent(returnTo)}`} replace />
    )
  }

  if (profileStatus === 'loading' || profileStatus === 'idle') {
    return <GuardSkeleton />
  }

  if (profileStatus === 'error') {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <ErrorState
          message={
            profileError ??
            'Your profile could not be loaded. Please try again.'
          }
          onRetry={() => {
            void refreshProfile()
          }}
        />
      </div>
    )
  }

  if (needsOnboarding && !isProfilePath(location.pathname)) {
    return (
      <Navigate
        to={`/profile?onboarding=1&returnTo=${encodeURIComponent(
          `${location.pathname}${location.search}`,
        )}`}
        replace
      />
    )
  }

  return (
    <>
      {needsAvatarOnboarding ? <ChooseAvatarOverlay /> : null}
      <Outlet />
    </>
  )
}
