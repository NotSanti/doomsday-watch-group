export const DOOMSDAY_TARGET_ISO = '2026-12-18T00:00:00-05:00'

export type CountdownParts = {
  elapsed: boolean
  months: number
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

function addCalendarMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime())
  const originalDay = result.getDate()
  result.setMonth(result.getMonth() + months)

  if (result.getDate() !== originalDay) {
    result.setDate(0)
  }

  return result
}

export function getCountdownParts(now: Date, target: Date): CountdownParts {
  const totalMs = target.getTime() - now.getTime()

  if (totalMs <= 0) {
    return {
      elapsed: true,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs,
    }
  }

  let months =
    (target.getFullYear() - now.getFullYear()) * 12 +
    (target.getMonth() - now.getMonth())
  let monthAnchor = addCalendarMonths(now, months)

  if (monthAnchor.getTime() > target.getTime()) {
    months -= 1
    monthAnchor = addCalendarMonths(now, months)
  }

  const remainderMs = target.getTime() - monthAnchor.getTime()

  return {
    elapsed: false,
    months,
    days: Math.floor(remainderMs / MS_PER_DAY),
    hours: Math.floor((remainderMs % MS_PER_DAY) / MS_PER_HOUR),
    minutes: Math.floor((remainderMs % MS_PER_HOUR) / MS_PER_MINUTE),
    seconds: Math.floor((remainderMs % MS_PER_MINUTE) / MS_PER_SECOND),
    totalMs,
  }
}

export function padUnit(value: number): string {
  return String(value).padStart(2, '0')
}

export function formatCountdownClock(parts: CountdownParts): string {
  return [parts.months, parts.days, parts.hours, parts.minutes, parts.seconds]
    .map(padUnit)
    .join(':')
}
