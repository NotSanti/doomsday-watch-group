import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/use-auth'
import { GroupSwitcher } from '@/features/groups/GroupSwitcher'
import { useGroup } from '@/features/groups/use-groups'
import { cn } from '@/lib/utils'

type AppNavLink = {
  to: string
  label: string
  end: boolean
}

function AppNavLinks({
  links,
  className,
  linkClassName,
  onNavigate,
  onSignOut,
}: {
  links: AppNavLink[]
  className?: string
  linkClassName?: string
  onNavigate?: () => void
  onSignOut?: () => void
}) {
  return (
    <ul className={className}>
      {links.map((link) => (
        <li key={link.to}>
          <NavLink
            to={link.to}
            end={link.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'block rounded-md px-3 py-2 text-sm text-secondary hover:bg-surface-hover hover:text-heading',
                linkClassName,
                isActive &&
                  'bg-surface-hover text-heading ring-1 ring-primary-emphasis/40',
              )
            }
          >
            {link.label}
          </NavLink>
        </li>
      ))}
      <li>
        <Button
          className={cn('w-full justify-start', linkClassName)}
          onClick={() => {
            onNavigate?.()
            onSignOut?.()
          }}
          size="sm"
          type="button"
          variant="ghost"
        >
          Sign out
        </Button>
      </li>
    </ul>
  )
}

export function AppShell() {
  const { groupId } = useParams()
  const location = useLocation()
  const { signOut } = useAuth()
  const groupQuery = useGroup(groupId ?? '')
  const [menuOpen, setMenuOpen] = useState(false)
  const isMember = Boolean(groupId && groupQuery.data)
  const base = isMember ? `/groups/${groupId}` : '/app'

  const links: AppNavLink[] = [
    { to: '/app', label: 'Groups', end: true },
    ...(isMember
      ? [
          { to: base, label: 'Dashboard', end: true },
          { to: `${base}/watchlist`, label: 'Watchlist', end: false },
          { to: `${base}/members`, label: 'Members', end: false },
          { to: `${base}/settings`, label: 'Settings', end: false },
        ]
      : []),
    { to: '/profile', label: 'Profile', end: false },
  ]

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-bg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-on-primary"
      >
        Skip to content
      </a>
      <header className="border-b border-border bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Link
              to="/app"
              className="min-w-0 break-words font-display text-base tracking-[0.16em] text-heading uppercase sm:text-lg"
            >
              Doomsday Watch Group
            </Link>
            <GroupSwitcher />
          </div>
          <nav aria-label="App" className="hidden md:block">
            <AppNavLinks
              className="flex flex-wrap items-center gap-3"
              links={links}
              onSignOut={() => {
                void signOut()
              }}
            />
          </nav>
          <Button
            aria-controls="app-mobile-nav"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="shrink-0 md:hidden"
            onClick={() => {
              setMenuOpen((open) => !open)
            }}
            size="sm"
            type="button"
            variant="ghost"
          >
            {menuOpen ? (
              <X aria-hidden="true" className="size-5" />
            ) : (
              <Menu aria-hidden="true" className="size-5" />
            )}
          </Button>
        </div>
        {menuOpen ? (
          <nav
            aria-label="App"
            className="border-t border-border md:hidden"
            id="app-mobile-nav"
          >
            <AppNavLinks
              className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3"
              linkClassName="px-2"
              links={links}
              onNavigate={() => {
                setMenuOpen(false)
              }}
              onSignOut={() => {
                void signOut()
              }}
            />
          </nav>
        ) : null}
      </header>
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
