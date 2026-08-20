import * as DialogPrimitive from '@radix-ui/react-dialog'
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
}: {
  className?: string
  children: ReactNode
  title: string
  description?: string
  preventDismiss?: boolean
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-bg/80" />
      <DialogPrimitive.Content
        className={cn(
          'fixed top-1/2 left-1/2 z-50 w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface-elevated p-6 shadow-[0_16px_60px_rgba(0,0,0,0.45)]',
          className,
        )}
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
        <DialogPrimitive.Title className="font-display text-2xl tracking-[0.08em] text-heading uppercase">
          {title}
        </DialogPrimitive.Title>
        {description ? (
          <DialogPrimitive.Description className="mt-2 text-sm text-muted">
            {description}
          </DialogPrimitive.Description>
        ) : null}
        <div className="mt-4">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
