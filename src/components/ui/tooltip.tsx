import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function TooltipProvider(props: TooltipPrimitive.TooltipProviderProps) {
  return <TooltipPrimitive.Provider delayDuration={0} skipDelayDuration={0} {...props} />
}

export function Tooltip(props: TooltipPrimitive.TooltipProps) {
  return <TooltipPrimitive.Root {...props} />
}

export function TooltipTrigger(props: TooltipPrimitive.TooltipTriggerProps) {
  return <TooltipPrimitive.Trigger {...props} />
}

export function TooltipContent({
  className,
  children,
  sideOffset = 8,
  ...props
}: TooltipPrimitive.TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          'z-50 max-w-80 rounded-xl border border-accent/30 bg-surface-elevated p-3 text-sm text-heading shadow-[0_16px_40px_rgba(0,0,0,0.45)]',
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="fill-surface-elevated" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export function TooltipLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 font-display text-xs tracking-[0.12em] text-accent uppercase">
      {children}
    </p>
  )
}
