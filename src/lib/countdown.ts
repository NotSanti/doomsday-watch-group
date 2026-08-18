export const MOCK_DOOMSDAY_ISO = '2026-12-18T00:00:00-05:00'

export type CountdownParts = {
  elapsed: boolean
  days: number
  hours: number
  minutes: number
  seconds: number
  totalMs: number
}

const MS_PER_SECOND = 1000
const MS_PER_MINUTE = 60 * MS_PER_SECOND
const MS_PER_HOUR = 60 * MS_PER_MINUTE
const MS_PER_DAY = 24 * MS_PER_HOUR

export function getCountdownParts(now: Date, target: Date): CountdownParts {
  const totalMs = target.getTime() - now.getTime()

  if (totalMs <= 0) {
    return {
      elapsed: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs,
    }
  }

  return {
    elapsed: false,
    days: Math.floor(totalMs / MS_PER_DAY),
    hours: Math.floor((totalMs % MS_PER_DAY) / MS_PER_HOUR),
    minutes: Math.floor((totalMs % MS_PER_HOUR) / MS_PER_MINUTE),
    seconds: Math.floor((totalMs % MS_PER_MINUTE) / MS_PER_SECOND),
    totalMs,
  }
}

export function padUnit(value: number): string {
  return String(value).padStart(2, '0')
}
