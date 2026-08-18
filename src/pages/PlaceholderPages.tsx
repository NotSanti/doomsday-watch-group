import { EmptyState } from '@/components/EmptyState'
import { useParams } from 'react-router'

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
