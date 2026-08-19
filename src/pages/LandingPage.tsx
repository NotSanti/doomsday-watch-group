import { Link } from 'react-router'
import { Countdown } from '@/components/Countdown'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { MOCK_DOOMSDAY_ISO } from '@/lib/countdown'

export function LandingPage() {
  return (
    <main>
      <section className="hero-background relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(#929b94_1px,transparent_1px)] [background-size:28px_28px]"
        />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
          <div>
            <Badge tone="watching">Private watch group</Badge>
            <h1 className="metallic-text mt-4 font-display text-5xl tracking-[0.08em] uppercase sm:text-6xl lg:text-7xl">
              Watch together on the road to Doomsday
            </h1>
            <p className="mt-4 max-w-xl text-lg text-secondary">
              Create a private MCU watch group, invite friends, follow a shared
              order, and compare everyone’s progress and opinions.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/auth">Create your watch group</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/invite">Join with an invite</Link>
              </Button>
            </div>
          </div>
          <Card className="relative rating-glow">
            <p className="gold-text text-sm uppercase">Countdown</p>
            <Countdown className="mt-4" targetIso={MOCK_DOOMSDAY_ISO} />
            <p className="mt-4 text-center text-xs text-muted">
              Mock target date for development. The live date will be
              configurable per group.
            </p>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="font-display text-3xl tracking-[0.1em] text-heading uppercase">
          Three steps
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              step: '01',
              title: 'Create',
              body: 'Start a private group and become its owner.',
            },
            {
              step: '02',
              title: 'Invite',
              body: 'Share a time-limited invite link or code with friends.',
            },
            {
              step: '03',
              title: 'Watch together',
              body: 'Track progress, rate titles, and keep the group in sync.',
            },
          ].map((item) => (
            <Card key={item.step}>
              <p className="font-display text-sm tracking-[0.2em] text-primary-emphasis">
                {item.step}
              </p>
              <CardTitle className="mt-2">{item.title}</CardTitle>
              <p className="mt-2 text-muted">{item.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="font-display text-3xl tracking-[0.1em] text-heading uppercase">
          Dashboard preview
        </h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardTitle>Current title</CardTitle>
            <p className="mt-2 text-muted">
              Poster, runtime, and watch-order position will live here once the
              catalog is connected.
            </p>
            <div className="hero-background mt-4 h-40 rounded-lg border border-border" />
          </Card>
          <Card>
            <CardTitle>Watchlist</CardTitle>
            <p className="mt-2 text-muted">
              A shared MCU order with personal status and group completion.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex justify-between border-b border-border pb-2">
                <span>01 · Iron Man</span>
                <Badge tone="watched">Watched</Badge>
              </li>
              <li className="flex justify-between border-b border-border pb-2">
                <span>02 · The Incredible Hulk</span>
                <Badge tone="notStarted">Not watching</Badge>
              </li>
              <li className="flex justify-between">
                <span>03 · Iron Man 2</span>
                <Badge tone="rating">Rated 8.5</Badge>
              </li>
            </ul>
          </Card>
        </div>
      </section>
    </main>
  )
}
