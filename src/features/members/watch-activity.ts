import type { GroupProgressRow } from '@/features/progress/progress-schemas'
import { calendarDateInTimeZone, zonedStartOfDayIso } from '@/lib/timezone'

export type YearGridCell = {
  date: string
  month: number
  day: number
  active: boolean
  watchCount: number
}

const WEEKDAY_LABEL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

export function calendarWeekday(date: string, timeZone: string): number {
  const iso = zonedStartOfDayIso(date, timeZone)
  const label = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
  }).format(new Date(iso))
  const index = WEEKDAY_LABEL.indexOf(label as (typeof WEEKDAY_LABEL)[number])
  return index === -1 ? 0 : index
}

export function currentYearInTimeZone(
  timeZone: string,
  now: Date = new Date(),
): number {
  const parts = calendarDateInTimeZone(now.toISOString(), timeZone).split('-')
  return Number(parts[0])
}

export function shiftYear(year: number, delta: number): number {
  return year + delta
}

export function formatYearLabel(year: number): string {
  return String(year)
}

export function monthLabelsForYear(
  year: number,
  timeZone: string,
): { label: string; weekIndex: number }[] {
  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1
    const iso = zonedStartOfDayIso(`${year}-${pad(month)}-01`, timeZone)
    const label = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      timeZone,
    }).format(new Date(iso))
    return {
      label,
      weekIndex: weekIndexForDate(`${year}-${pad(month)}-01`, timeZone),
    }
  })
}

export function watchesByCalendarDate(
  progress: readonly GroupProgressRow[],
  userId: string,
  timeZone: string,
): Map<string, number> {
  const counts = new Map<string, number>()

  for (const row of progress) {
    if (row.user_id !== userId || row.status !== 'watched' || !row.watched_at) {
      continue
    }

    const date = calendarDateInTimeZone(row.watched_at, timeZone)
    counts.set(date, (counts.get(date) ?? 0) + 1)
  }

  return counts
}

export function watchCountInYear(
  watchesByDate: ReadonlyMap<string, number>,
  year: number,
): number {
  const prefix = `${String(year)}-`
  let total = 0

  for (const [date, count] of watchesByDate) {
    if (date.startsWith(prefix)) {
      total += count
    }
  }

  return total
}

export function weekIndexForDate(date: string, timeZone: string): number {
  const [yearValue, monthValue, dayValue] = date.split('-').map(Number)
  const year = yearValue ?? 0
  const month = monthValue ?? 1
  const day = dayValue ?? 1
  let weekIndex = 0

  for (let currentMonth = 1; currentMonth < month; currentMonth += 1) {
    const dim = daysInMonth(year, currentMonth)
    const firstWeekday = calendarWeekday(
      `${year}-${pad(currentMonth)}-01`,
      timeZone,
    )
    weekIndex += Math.ceil((firstWeekday + dim) / 7)
  }

  const firstWeekday = calendarWeekday(`${year}-${pad(month)}-01`, timeZone)
  return weekIndex + Math.floor((firstWeekday + day - 1) / 7)
}

export function buildYearWatchGrid(
  year: number,
  watchesByDate: ReadonlyMap<string, number>,
  timeZone: string,
): { cells: (YearGridCell | null)[][]; weekCount: number } {
  const weekCount = weekIndexForDate(`${year}-12-31`, timeZone) + 1
  const cells: (YearGridCell | null)[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: weekCount }, () => null),
  )

  for (let month = 1; month <= 12; month += 1) {
    const dim = daysInMonth(year, month)

    for (let day = 1; day <= dim; day += 1) {
      const date = `${String(year)}-${pad(month)}-${pad(day)}`
      const weekday = calendarWeekday(date, timeZone)
      const weekIndex = weekIndexForDate(date, timeZone)
      const watchCount = watchesByDate.get(date) ?? 0

      const row = cells[weekday]
      if (!row) {
        continue
      }

      row[weekIndex] = {
        date,
        month,
        day,
        active: watchCount > 0,
        watchCount,
      }
    }
  }

  return { cells, weekCount }
}

export function isFutureYear(
  year: number,
  timeZone: string,
  now: Date = new Date(),
): boolean {
  return year > currentYearInTimeZone(timeZone, now)
}
