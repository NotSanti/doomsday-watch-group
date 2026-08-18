import { Outlet } from 'react-router'
import { PublicFooter, PublicHeader } from '@/layouts/PublicChrome'

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <div className="flex-1">
        <Outlet />
      </div>
      <PublicFooter />
    </div>
  )
}
