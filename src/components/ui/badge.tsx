import type { HTMLAttributes } from 'react'
import { chipClasses, type ChipTone } from '@/lib/chip-styles'
import { cn } from '@/lib/utils'

type BadgeTone =
  | 'gold'
  | 'green'
  | 'violet'
  | 'metal'
  | 'watching'
  | 'watched'
  | 'notStarted'
  | 'rating'
  | 'muted'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone
}

const BADGE_TONE: Record<BadgeTone, ChipTone> = {
  gold: 'gold',
  green: 'green',
  violet: 'violet',
  metal: 'metal',
  watching: 'green',
  watched: 'green',
  notStarted: 'metal',
  rating: 'gold',
  muted: 'metal',
}

export function Badge({ className, tone = 'gold', ...props }: BadgeProps) {
  return (
    <span
      className={cn(chipClasses(BADGE_TONE[tone], 'pill'), className)}
      {...props}
    />
  )
}
