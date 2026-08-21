import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Dialog(props: DialogPrimitive.DialogProps) {
  return <DialogPrimitive.Root {...props} />
}

export function DialogTrigger(props: DialogPrimitive.DialogTriggerProps) {
  return <DialogPrimitive.Trigger {...props} />
}

export function DialogClose(props: DialogPrimitive.DialogCloseProps) {
  return <DialogPrimitive.Close {...props} />
}

export function DialogContent({
  className,
  children,
  title,
  description,
  preventDismiss = false,
  onOpenAutoFocus,
}: {
  className?: string
  children: ReactNode
  title: string
  description?: string
  preventDismiss?: boolean
  onOpenAutoFocus?: DialogPrimitive.DialogContentProps['onOpenAutoFocus']
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 hidden bg-bg/50 backdrop-blur-sm md:block" />
      <DialogPrimitive.Content
        className={cn(
          // Mobile: edge-to-edge frosted sheet. Desktop: centered glass card.
          'fixed inset-0 z-50 flex h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden border-0 bg-surface-elevated/70 p-4 shadow-none backdrop-blur-2xl backdrop-saturate-150',
          'md:inset-auto md:top-1/2 md:left-1/2 md:h-auto md:max-h-[min(40rem,calc(100dvh-2rem))] md:w-[min(28rem,calc(100%-2rem))] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-xl md:border md:border-border/40 md:p-6 md:shadow-[0_16px_60px_rgba(0,0,0,0.35)]',
          className,
        )}
        onOpenAutoFocus={onOpenAutoFocus}
        onPointerDownOutside={(event) => {
          if (preventDismiss) {
            event.preventDefault()
          }
        }}
        onInteractOutside={(event) => {
          if (preventDismiss) {
            event.preventDefault()
          }
        }}
        onEscapeKeyDown={(event) => {
          if (preventDismiss) {
            event.preventDefault()
          }
        }}
      >
        <div className="flex shrink-0 items-start justify-between gap-3">
          <DialogPrimitive.Title className="min-w-0 flex-1 font-display text-2xl tracking-[0.08em] text-heading uppercase">
            {title}
          </DialogPrimitive.Title>
          {preventDismiss ? null : (
            <DialogPrimitive.Close
              type="button"
              aria-label="Close"
              className={cn(
                'inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-chip-metal-fg',
                'hover:bg-chip-metal-bg hover:text-heading',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
                'md:hidden',
              )}
            >
              <X aria-hidden="true" className="size-5" />
            </DialogPrimitive.Close>
          )}
        </div>
        {description ? (
          <DialogPrimitive.Description className="mt-2 shrink-0 text-sm text-muted">
            {description}
          </DialogPrimitive.Description>
        ) : null}
        <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
