import { useEffect, useState } from 'react'
import {
  getCountdownParts,
  padUnit,
  type CountdownParts,
} from '@/lib/countdown'
import { cn } from '@/lib/utils'

type CountdownProps = {
  targetIso: string
  className?: string
}

function Unit({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[4.5rem] rounded-lg border border-border bg-surface-2 px-3 py-3 text-center">
      <div className="font-display text-3xl tracking-[0.12em] text-heading sm:text-4xl">
        {value}
      </div>
      <div className="mt-1 text-xs text-muted uppercase">{label}</div>
    </div>
  )
}

export function Countdown({ targetIso, className }: CountdownProps) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    const tick = () => {
      setNow(new Date())
    }

    tick()
    const id = window.setInterval(tick, 1000)
    return () => {
      window.clearInterval(id)
    }
  }, [])

  const target = new Date(targetIso)
  const parts: CountdownParts | null = now
    ? getCountdownParts(now, target)
    : null

  return (
    <div
      className={cn('flex flex-wrap justify-center gap-3', className)}
      aria-live="polite"
    >
      {parts?.elapsed ? (
        <p className="font-display text-2xl tracking-[0.12em] text-gold uppercase">
          The date has arrived
        </p>
      ) : (
        <>
          <Unit label="Days" value={parts ? String(parts.days) : '--'} />
          <Unit label="Hours" value={parts ? padUnit(parts.hours) : '--'} />
          <Unit label="Minutes" value={parts ? padUnit(parts.minutes) : '--'} />
          <Unit label="Seconds" value={parts ? padUnit(parts.seconds) : '--'} />
        </>
      )}
    </div>
  )
}
