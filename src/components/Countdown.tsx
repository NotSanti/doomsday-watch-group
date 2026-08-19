import { useEffect, useState } from 'react'
import {
  DOOMSDAY_TARGET_ISO,
  formatCountdownClock,
  getCountdownParts,
  padUnit,
  type CountdownParts,
} from '@/lib/countdown'
import { cn } from '@/lib/utils'

type CountdownProps = {
  targetIso?: string
  className?: string
}

const UNITS = [
  { key: 'Month', field: 'months' },
  { key: 'Day', field: 'days' },
  { key: 'Hour', field: 'hours' },
  { key: 'Minute', field: 'minutes' },
  { key: 'Second', field: 'seconds' },
] as const

function Unit({
  label,
  value,
  separator,
}: {
  label: string
  value: string
  separator: boolean
}) {
  return (
    <>
      {separator ? (
        <span
          aria-hidden="true"
          className="metallic-text font-display text-3xl leading-none tracking-[0.08em] sm:text-4xl"
        >
          :
        </span>
      ) : null}
      <div className="min-w-[4.25rem] text-center sm:min-w-[4.75rem]">
        <div className="metallic-text font-display text-3xl tracking-[0.08em] sm:text-4xl">
          {value}
        </div>
        <div className="mt-1 text-[0.65rem] tracking-[0.18em] text-secondary uppercase">
          {label}
        </div>
      </div>
    </>
  )
}

export function Countdown({
  targetIso = DOOMSDAY_TARGET_ISO,
  className,
}: CountdownProps) {
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
      className={cn(
        'flex flex-wrap items-end justify-center gap-1 sm:gap-2',
        className,
      )}
      aria-live="polite"
      role="timer"
      aria-label={
        parts
          ? parts.elapsed
            ? 'The date has arrived'
            : formatCountdownClock(parts)
          : 'Loading countdown'
      }
    >
      {parts?.elapsed ? (
        <p className="gold-text font-display text-2xl tracking-[0.12em] uppercase">
          The date has arrived
        </p>
      ) : (
        UNITS.map((unit, index) => (
          <Unit
            key={unit.key}
            label={unit.key}
            separator={index > 0}
            value={parts ? padUnit(parts[unit.field]) : '--'}
          />
        ))
      )}
    </div>
  )
}
