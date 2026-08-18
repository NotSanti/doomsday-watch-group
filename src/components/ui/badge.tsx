import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BadgeTone = 'watching' | 'watched' | 'notStarted' | 'rating' | 'muted'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone
}

export function Badge({ className, tone = 'muted', ...props }: BadgeProps) {
  const tones: Record<BadgeTone, string> = {
    watching: 'border-primary-muted bg-primary-muted text-doom-100',
    watched: 'border-primary-emphasis/40 bg-primary-emphasis text-on-primary',
    notStarted: 'border-metal/40 bg-surface-elevated text-metal',
    rating: 'border-accent/40 bg-accent text-on-primary',
    muted: 'border-border bg-surface-elevated text-metal',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
