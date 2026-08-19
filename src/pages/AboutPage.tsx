import { TmdbCredit } from '@/features/watchlist/TmdbCredit'

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
        The watch order is an editorial catalog stored in this project. Artwork
        and some metadata come from The Movie Database.
      </p>
      <TmdbCredit className="mt-4 text-muted" />
      <p className="mt-4 text-muted">
        Privacy details will be added before collecting real user data.
      </p>
    </main>
  )
}
