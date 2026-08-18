import { Link, NavLink, Outlet, useParams } from 'react-router'
import { cn } from '@/lib/utils'

export function AppShell() {
  const { groupId } = useParams()
  const base = groupId ? `/groups/${groupId}` : '/app'

  const links = [
    { to: '/app', label: 'Groups', end: true },
    ...(groupId
      ? [
          { to: base, label: 'Dashboard', end: true },
          { to: `${base}/watchlist`, label: 'Watchlist', end: false },
          { to: `${base}/members`, label: 'Members', end: false },
          { to: `${base}/settings`, label: 'Settings', end: false },
        ]
      : []),
    { to: '/profile', label: 'Profile', end: false },
  ]

  return (
    <div className="min-h-screen bg-bg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-on-primary"
      >
        Skip to content
      </a>
      <header className="border-b border-border bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link
            to="/app"
            className="font-display text-lg tracking-[0.16em] text-heading uppercase"
          >
            Doomsday Watch Group
          </Link>
          <nav aria-label="App">
            <ul className="flex flex-wrap items-center gap-3">
              {links.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      cn(
                        'rounded-md px-3 py-2 text-sm text-secondary hover:bg-surface-hover hover:text-heading',
                        isActive &&
                          'bg-surface-hover text-heading ring-1 ring-primary-emphasis/40',
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
