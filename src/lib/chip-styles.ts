import { cn } from '@/lib/utils'

export type ChipTone = 'gold' | 'green' | 'violet' | 'metal' | 'danger'

export const CHIP_BASE =
  'inline-flex items-center border font-medium uppercase tracking-[0.08em]'

export const CHIP_PILL = 'rounded-full px-2.5 py-0.5 text-xs'

export const CHIP_SQUARE =
  'size-10 shrink-0 justify-center rounded-md font-display text-[9px] font-semibold tracking-[0.1em]'

const TONE_CLASSES: Record<ChipTone, string> = {
  gold: 'border-chip-gold-fg bg-chip-gold-bg text-chip-gold-fg',
  green: 'border-chip-green-fg bg-chip-green-bg text-chip-green-fg',
  violet: 'border-chip-violet-fg bg-chip-violet-bg text-chip-violet-fg',
  metal: 'border-chip-metal-fg bg-chip-metal-bg text-chip-metal-fg',
  danger: 'border-chip-danger-fg bg-chip-danger-bg text-chip-danger-fg',
}

const BUTTON_HOVER: Record<ChipTone, string> = {
  gold: 'hover:bg-[color-mix(in_srgb,var(--color-chip-gold-fg)_16%,var(--color-chip-gold-bg))]',
  green:
    'hover:bg-[color-mix(in_srgb,var(--color-chip-green-fg)_16%,var(--color-chip-green-bg))]',
  violet:
    'hover:bg-[color-mix(in_srgb,var(--color-chip-violet-fg)_16%,var(--color-chip-violet-bg))]',
  metal:
    'hover:bg-[color-mix(in_srgb,var(--color-chip-metal-fg)_16%,var(--color-chip-metal-bg))]',
  danger:
    'hover:bg-[color-mix(in_srgb,var(--color-chip-danger-fg)_16%,var(--color-chip-danger-bg))]',
}

export function chipToneClasses(tone: ChipTone): string {
  return TONE_CLASSES[tone]
}

export function chipClasses(
  tone: ChipTone,
  variant: 'pill' | 'square' = 'pill',
  className?: string,
): string {
  return cn(
    CHIP_BASE,
    variant === 'pill' ? CHIP_PILL : CHIP_SQUARE,
    chipToneClasses(tone),
    className,
  )
}

export function chipButtonClasses(tone: ChipTone, className?: string): string {
  return cn(
    CHIP_BASE,
    chipToneClasses(tone),
    BUTTON_HOVER[tone],
    className,
  )
}
