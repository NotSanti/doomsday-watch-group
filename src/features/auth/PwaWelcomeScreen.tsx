import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/Skeleton'
import type { AuthStatus } from '@/features/auth/auth-context'
import { cn } from '@/lib/utils'

type PwaWelcomeScreenProps = {
  authStatus: AuthStatus
}

export function PwaWelcomeScreen({ authStatus }: PwaWelcomeScreenProps) {
  const loading = authStatus === 'loading'

  return (
    <main
      className={cn(
        'hero-background relative flex min-h-dvh flex-col overflow-hidden px-6 py-10',
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:radial-gradient(#929b94_1.5px,transparent_1.5px)] [background-size:32px_32px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-primary-emphasis/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-24 -left-16 size-56 rounded-full bg-accent/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 bottom-40 size-48 rounded-full bg-primary-muted/40 blur-3xl"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-sm flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <img
            src="/doomWatchPartyLogo.svg"
            alt=""
            width={112}
            height={112}
            className="size-28 animate-[pwa-welcome-fade_700ms_ease-out_both]"
          />
          <h1 className="metallic-text mt-8 animate-[pwa-welcome-rise_800ms_ease-out_120ms_both] font-display text-4xl tracking-[0.12em] uppercase sm:text-5xl">
            Welcome to Doom Watch Party
          </h1>
          <p className="mt-4 max-w-[22rem] animate-[pwa-welcome-rise_800ms_ease-out_220ms_both] text-pretty text-base text-secondary">
            Private MCU watch groups on the road to Doomsday. Create an account
            or sign in to get started.
          </p>
        </div>

        <div className="animate-[pwa-welcome-rise_800ms_ease-out_320ms_both] space-y-3 pb-2">
          {loading ? (
            <>
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
            </>
          ) : (
            <>
              <Button
                asChild
                size="lg"
                className="h-12 w-full rounded-lg border-transparent bg-heading text-bg hover:bg-metal-200"
              >
                <Link to="/auth?mode=signup&returnTo=%2Fapp">Register</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="h-12 w-full rounded-lg"
              >
                <Link to="/auth?returnTo=%2Fapp">Log in</Link>
              </Button>
            </>
          )}
          <p className="pt-3 text-center text-xs text-muted">
            Unofficial fan project. Not affiliated with or endorsed by Marvel or
            Disney.
          </p>
        </div>
      </div>
    </main>
  )
}
