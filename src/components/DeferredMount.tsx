import type { ReactNode } from 'react'
import { useDeferredMount } from '@/hooks/use-deferred-mount'
import { Skeleton } from '@/components/Skeleton'
import { cn } from '@/lib/utils'

type DeferredMountProps = {
  children: ReactNode
  eager?: boolean
  className?: string
  fallback?: ReactNode
}

export function DeferredMount({
  children,
  eager = false,
  className,
  fallback = <Skeleton className="h-36 w-full" />,
}: DeferredMountProps) {
  const { ref, shouldMount } = useDeferredMount({ eager })

  return (
    <div ref={ref} className={cn(className)}>
      {shouldMount ? children : fallback}
    </div>
  )
}
