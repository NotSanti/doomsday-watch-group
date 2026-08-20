import { ChevronDown } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type CollapsibleSectionProps = {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  className?: string
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  className,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()

  return (
    <section className={cn('space-y-3', className)}>
      <h2>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-md text-left focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
          onClick={() => {
            setOpen((current) => !current)
          }}
        >
          <span className="font-display text-2xl tracking-[0.08em] text-heading uppercase">
            {title}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              'size-5 shrink-0 text-secondary transition-transform duration-200',
              open && 'rotate-180',
            )}
          />
        </button>
      </h2>
      {open ? <div id={panelId}>{children}</div> : null}
    </section>
  )
}
