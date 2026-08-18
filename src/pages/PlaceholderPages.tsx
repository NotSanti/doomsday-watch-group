import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { Link, useParams } from 'react-router'

export function AuthPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <Card>
        <CardTitle>Sign in</CardTitle>
        <p className="mt-3 text-muted">
          Email authentication lands in Milestone 3. This route is a shell.
        </p>
        <Button asChild className="mt-6 w-full">
          <Link to="/app">Continue to app shell</Link>
        </Button>
      </Card>
    </main>
  )
}

export function InvitePage() {
  const { token } = useParams()

  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <Card>
        <CardTitle>Join a watch group</CardTitle>
        <p className="mt-3 text-muted">
          Invite token <span className="text-heading">{token}</span> will be
          validated in Milestone 5. No private reviews are shown here.
        </p>
        <Button asChild className="mt-6">
          <Link to="/auth">Sign in to join</Link>
        </Button>
      </Card>
    </main>
  )
}

export function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-4xl tracking-[0.08em] text-heading uppercase">
        About
      </h1>
      <p className="mt-4 text-text">
        Doomsday Watch Group is an unofficial fan project. Not affiliated with
        or endorsed by Marvel or Disney.
      </p>
      <p className="mt-4 text-muted">
        Catalog artwork and metadata will use TMDB with the required
        attribution. Privacy details will be added before collecting real user
        data.
      </p>
    </main>
  )
}

export function AppHomePage() {
  return (
    <EmptyState
      title="Your groups"
      description="Create or join a private watch group. Group creation is wired in Milestone 4."
      action={
        <Button asChild>
          <Link to="/groups/demo">Open demo group shell</Link>
        </Button>
      }
    />
  )
}

export function GroupDashboardPage() {
  return (
    <EmptyState
      title="Group dashboard"
      description="Current title, progress, activity, and standings will appear here."
    />
  )
}

export function WatchlistPage() {
  return (
    <EmptyState
      title="Watchlist"
      description="The curated MCU order, filters, and title cards land in Milestone 6."
    />
  )
}

export function TitleDetailPage() {
  const { titleId } = useParams()

  return (
    <EmptyState
      title="Title detail"
      description={`Metadata shell for ${titleId ?? 'this title'}. Progress and reviews come later.`}
    />
  )
}

export function MembersPage() {
  return (
    <EmptyState
      title="Members"
      description="Member progress comparison is a later milestone."
    />
  )
}

export function SettingsPage() {
  return (
    <EmptyState
      title="Group settings"
      description="Owner-only invites, current title, and destructive actions land later."
    />
  )
}

export function ProfilePage() {
  return (
    <EmptyState
      title="Profile"
      description="Display name and avatar onboarding will be added with authentication."
    />
  )
}
