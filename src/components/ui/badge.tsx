import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'crimson' | 'violet' | 'gold' | 'muted'
}

export function Badge({ className, tone = 'muted', ...props }: BadgeProps) {
  const tones = {
    crimson: 'border-crimson/40 text-crimson bg-crimson/10',
    violet: 'border-violet/40 text-violet bg-violet/10',
    gold: 'border-gold/40 text-gold bg-gold/10',
    muted: 'border-border text-muted bg-surface-2',
  } as const

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
