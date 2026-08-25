import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Menu, X } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useMatch, useParams } from 'react-router'
import { AppVersionLabel } from '@/components/AppVersionLabel'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/use-auth'
import { GroupSwitcher } from '@/features/groups/GroupSwitcher'
import { GROUPS_LIST_NAV_STATE } from '@/features/groups/home-group'
import { useGroup } from '@/features/groups/use-groups'
import { prefetchMembersPage } from '@/features/members/prefetch-members-page'
import { usePwaPushPermissionPrompt } from '@/features/notifications/use-pwa-push-permission-prompt'
import { isStandalonePwa } from '@/features/notifications/push-utils'
import { useRouteMenuOpen } from '@/hooks/use-route-menu-open'
import { cn } from '@/lib/utils'

type AppNavLink = {
  to: string
  label: string
  end: boolean
  state?: typeof GROUPS_LIST_NAV_STATE
}

function AppNavLinks({
  links,
  className,
  linkClassName,
  onNavigate,
  onPrefetch,
  onSignOut,
}: {
  links: AppNavLink[]
  className?: string
  linkClassName?: string
  onNavigate?: () => void
  onPrefetch?: (to: string) => void
  onSignOut?: () => void
}) {
  return (
    <ul className={className}>
      {links.map((link) => (
        <li key={link.to}>
          <NavLink
            to={link.to}
            state={link.state}
            end={link.end}
            onClick={onNavigate}
            onPointerEnter={() => {
              onPrefetch?.(link.to)
            }}
            onFocus={() => {
              onPrefetch?.(link.to)
            }}
            className={({ isActive }) =>
              cn(
                'block rounded-md px-3 py-2 text-sm text-secondary uppercase tracking-[0.08em] hover:bg-surface-hover hover:text-heading',
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
  const titlePage = useMatch('/groups/:groupId/titles/:titleId')
  const { signOut, user } = useAuth()
  const queryClient = useQueryClient()
  usePwaPushPermissionPrompt(user?.id)
  const groupQuery = useGroup(groupId ?? '')
  const [menuOpen, setMenuOpen] = useRouteMenuOpen()
  const standalone = isStandalonePwa()
  const isMember = Boolean(groupId && groupQuery.data)
  const base = isMember ? `/groups/${groupId}` : '/app'
  const watchlistHref = titlePage
    ? `/groups/${titlePage.params.groupId}/watchlist${location.search}`
    : null
  const membersHref = isMember ? `${base}/members` : null

  const links: AppNavLink[] = [
    { to: '/app', label: 'Groups', end: true, state: GROUPS_LIST_NAV_STATE },
    ...(isMember
      ? [
          { to: base, label: 'Dashboard', end: true },
          { to: `${base}/watchlist`, label: 'Watchlist', end: false },
          { to: `${base}/members`, label: 'Members', end: false },
          { to: `${base}/settings`, label: 'Settings', end: false },
        ]
      : []),
    {
      to: isMember ? `${base}/profile` : '/profile',
      label: 'Profile',
      end: false,
    },
  ]

  const prefetchLink = (to: string): void => {
    if (membersHref && to === membersHref && groupId) {
      prefetchMembersPage(queryClient, groupId)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-on-primary"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 bg-surface/60 backdrop-blur-lg md:static md:bg-surface/90 md:backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {watchlistHref ? (
              <Button
                asChild
                className="shrink-0 px-2 md:hidden"
                size="sm"
                variant="ghost"
              >
                <Link to={watchlistHref} aria-label="Back to watchlist">
                  <ArrowLeft aria-hidden="true" className="size-5" />
                </Link>
              </Button>
            ) : null}
            <Link
              to="/app"
              state={GROUPS_LIST_NAV_STATE}
              className="min-w-0 break-words font-display text-base tracking-[0.16em] text-heading uppercase sm:text-lg"
            >
              Doom Watch Party
            </Link>
            <GroupSwitcher />
          </div>
          <nav aria-label="App" className="hidden md:block">
            <AppNavLinks
              className="flex flex-wrap items-center gap-3"
              links={links}
              onPrefetch={prefetchLink}
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
              onPrefetch={prefetchLink}
              onSignOut={() => {
                void signOut()
              }}
            />
            {standalone ? (
              <div className="mx-auto max-w-6xl border-t border-border/60 px-4 py-3">
                <AppVersionLabel />
              </div>
            ) : null}
          </nav>
        ) : null}
      </header>
      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      {standalone ? null : (
        <footer className="border-t border-border/80">
          <div className="mx-auto max-w-6xl px-4 py-4">
            <AppVersionLabel />
          </div>
        </footer>
      )}
    </div>
  )
}
