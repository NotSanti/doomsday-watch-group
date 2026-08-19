import * as PopoverPrimitive from '@radix-ui/react-popover'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Popover(props: ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root {...props} />
}

export function PopoverTrigger(
  props: ComponentProps<typeof PopoverPrimitive.Trigger>,
) {
  return <PopoverPrimitive.Trigger {...props} />
}

export function PopoverContent({
  className,
  sideOffset = 8,
  align = 'end',
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 max-w-80 rounded-xl border border-accent/30 bg-surface-elevated p-3 text-sm text-heading shadow-[0_16px_40px_rgba(0,0,0,0.45)] outline-none',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

export function PopoverLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 font-display text-xs tracking-[0.12em] text-accent uppercase">
      {children}
    </p>
  )
}
