import { Menu, X } from 'lucide-react'
import { Link, NavLink } from 'react-router'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/use-auth'
import { useRouteMenuOpen } from '@/hooks/use-route-menu-open'
import { cn } from '@/lib/utils'

type PublicNavLink = {
  to: string
  label: string
}

function PublicNavLinks({
  links,
  className,
  linkClassName,
  onNavigate,
}: {
  links: PublicNavLink[]
  className?: string
  linkClassName?: string
  onNavigate?: () => void
}) {
  return (
    <ul className={className}>
      {links.map((link) => (
        <li key={link.to}>
          <NavLink
            to={link.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'block text-sm text-secondary uppercase tracking-[0.08em] hover:text-heading',
                linkClassName,
                isActive && 'text-primary-emphasis',
              )
            }
          >
            {link.label}
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

export function PublicHeader() {
  const { status } = useAuth()
  const [menuOpen, setMenuOpen] = useRouteMenuOpen()
  const links: PublicNavLink[] = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    status === 'authenticated'
      ? { to: '/app', label: 'App' }
      : { to: '/auth', label: 'Sign in' },
  ]

  return (
    <header className="sticky top-0 z-40 bg-surface/60 backdrop-blur-lg md:static md:bg-surface/90 md:backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
        <Link
          to="/"
          className="min-w-0 break-words font-display text-base tracking-[0.16em] text-heading uppercase sm:text-lg"
        >
          Doom Watch Party
        </Link>
        <nav aria-label="Public" className="hidden md:block">
          <PublicNavLinks
            className="flex items-center gap-4"
            links={links}
          />
        </nav>
        <Button
          aria-controls="public-mobile-nav"
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
          aria-label="Public"
          className="border-t border-border/80 md:hidden"
          id="public-mobile-nav"
        >
          <PublicNavLinks
            className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3"
            linkClassName="rounded-md px-2 py-2 hover:bg-surface-hover"
            links={links}
            onNavigate={() => {
              setMenuOpen(false)
            }}
          />
        </nav>
      ) : null}
    </header>
  )
}

export function PublicFooter() {
  return (
    <footer className="border-t border-border/80">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted">
        <p className="break-words">
          Unofficial fan project. Not affiliated with or endorsed by Marvel or
          Disney.
        </p>
        <p className="mt-2 break-words">
          This product uses the TMDB API but is not endorsed or certified by
          TMDB.
        </p>
      </div>
    </footer>
  )
}
