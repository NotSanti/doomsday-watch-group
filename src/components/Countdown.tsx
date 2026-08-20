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
          className="metallic-text shrink-0 px-0.5 font-display text-2xl leading-none tracking-[0.06em] sm:text-3xl lg:text-4xl xl:text-5xl"
        >
          :
        </span>
      ) : null}
      <div className="min-w-0 flex-1 text-center">
        <div className="metallic-text font-display text-2xl leading-none tracking-[0.06em] sm:text-3xl lg:text-4xl xl:text-5xl">
          {value}
        </div>
        <div className="mt-1 text-xs tracking-[0.14em] text-secondary uppercase sm:text-sm">
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
        'mx-auto flex w-full min-w-0 flex-nowrap items-end justify-center',
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
        <p className="gold-text font-display text-3xl tracking-[0.12em] uppercase sm:text-4xl">
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
