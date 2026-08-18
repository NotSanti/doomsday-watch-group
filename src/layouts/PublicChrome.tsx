import { Link, NavLink } from 'react-router'
import { cn } from '@/lib/utils'

const publicLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/auth', label: 'Sign in' },
]

export function PublicHeader() {
  return (
    <header className="border-b border-border/80 bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link
          to="/"
          className="font-display text-lg tracking-[0.16em] text-heading uppercase"
        >
          Doomsday Watch Group
        </Link>
        <nav aria-label="Public">
          <ul className="flex items-center gap-4">
            {publicLinks.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      'text-sm text-secondary hover:text-heading',
                      isActive && 'text-primary-emphasis',
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
  )
}

export function PublicFooter() {
  return (
    <footer className="border-t border-border/80">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted">
        <p>
          Unofficial fan project. Not affiliated with or endorsed by Marvel or
          Disney.
        </p>
      </div>
    </footer>
  )
}
