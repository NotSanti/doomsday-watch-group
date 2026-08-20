import { Outlet, useLocation } from 'react-router'
import { shouldShowPwaWelcomeGate } from '@/features/auth/pwa-welcome'
import { useAuth } from '@/features/auth/use-auth'
import { isStandalonePwa } from '@/features/notifications/push-utils'
import { PublicFooter, PublicHeader } from '@/layouts/PublicChrome'

export function PublicLayout() {
  const { status } = useAuth()
  const location = useLocation()
  const hideChrome =
    location.pathname === '/' &&
    shouldShowPwaWelcomeGate({
      isStandalone: isStandalonePwa(),
      authStatus: status,
    })

  return (
    <div className="flex min-h-screen flex-col">
      {hideChrome ? null : <PublicHeader />}
      <div className="flex-1">
        <Outlet />
      </div>
      {hideChrome ? null : <PublicFooter />}
    </div>
  )
}
