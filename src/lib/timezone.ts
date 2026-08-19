export const GROUP_TIMEZONES = [
  'America/Toronto',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Vancouver',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'UTC',
  'Asia/Tokyo',
  'Australia/Sydney',
] as const

export type GroupTimezone = (typeof GROUP_TIMEZONES)[number]

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function asTimeZone(timeZone: string): string {
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date())
    return timeZone
  } catch {
    return 'UTC'
  }
}

function zonedParts(
  date: Date,
  timeZone: string,
): { year: number; month: number; day: number; hour: number; minute: number; second: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: asTimeZone(timeZone),
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: values.hour === '24' ? 0 : Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  }
}

function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = zonedParts(date, timeZone)
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  )
  return asUtc - date.getTime()
}

export function calendarDateInTimeZone(iso: string, timeZone: string): string {
  const parts = zonedParts(new Date(iso), timeZone)
  return `${String(parts.year)}-${pad(parts.month)}-${pad(parts.day)}`
}

export function formatDateInTimeZone(iso: string, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      dateStyle: 'medium',
      timeZone: asTimeZone(timeZone),
    }).format(new Date(iso))
  } catch {
    return new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium' }).format(
      new Date(iso),
    )
  }
}

export function zonedStartOfDayIso(date: string, timeZone: string): string {
  const match = DATE_PATTERN.exec(date)
  if (!match) {
    throw new Error('INVALID_DATE')
  }

  const utcMidnight = new Date(`${date}T00:00:00.000Z`)
  const firstOffset = timeZoneOffsetMs(utcMidnight, timeZone)
  const guess = new Date(utcMidnight.getTime() - firstOffset)
  const secondOffset = timeZoneOffsetMs(guess, timeZone)
  return new Date(utcMidnight.getTime() - secondOffset).toISOString()
}

export function isGroupTimezone(value: string): value is GroupTimezone {
  return (GROUP_TIMEZONES as readonly string[]).includes(value)
}
