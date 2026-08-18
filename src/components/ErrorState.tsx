import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ErrorStateProps = {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-xl border border-crimson/40 bg-crimson/10 px-6 py-8 text-center',
        className,
      )}
    >
      <h2 className="font-display text-2xl tracking-[0.08em] text-heading uppercase">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-text">{message}</p>
      {onRetry ? (
        <Button className="mt-6" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}
