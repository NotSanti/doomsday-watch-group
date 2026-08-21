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

const weekdayFormatters = new Map<string, Intl.DateTimeFormat>()
const monthFormatters = new Map<string, Intl.DateTimeFormat>()

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function weekdayFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = weekdayFormatters.get(timeZone)
  if (cached) {
    return cached
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
  })
  weekdayFormatters.set(timeZone, formatter)
  return formatter
}

function monthFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = monthFormatters.get(timeZone)
  if (cached) {
    return cached
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    timeZone,
  })
  monthFormatters.set(timeZone, formatter)
  return formatter
}

function advanceDays(
  weekday: number,
  weekIndex: number,
  days: number,
): { weekday: number; weekIndex: number } {
  const nextWeekday = (weekday + days) % 7
  const nextWeekIndex = weekIndex + Math.floor((weekday + days) / 7)
  return { weekday: nextWeekday, weekIndex: nextWeekIndex }
}

export function calendarWeekday(date: string, timeZone: string): number {
  const iso = zonedStartOfDayIso(date, timeZone)
  const label = weekdayFormatter(timeZone).format(new Date(iso))
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
  let weekday = calendarWeekday(`${year}-01-01`, timeZone)
  let weekIndex = 0
  const labels: { label: string; weekIndex: number }[] = []

  for (let month = 1; month <= 12; month += 1) {
    const iso = zonedStartOfDayIso(`${year}-${pad(month)}-01`, timeZone)
    labels.push({
      label: monthFormatter(timeZone).format(new Date(iso)),
      weekIndex,
    })

    const next = advanceDays(weekday, weekIndex, daysInMonth(year, month))
    weekday = next.weekday
    weekIndex = next.weekIndex
  }

  return labels
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
  let weekday = calendarWeekday(`${year}-01-01`, timeZone)
  let weekIndex = 0

  for (let currentMonth = 1; currentMonth < month; currentMonth += 1) {
    const next = advanceDays(weekday, weekIndex, daysInMonth(year, currentMonth))
    weekday = next.weekday
    weekIndex = next.weekIndex
  }

  return weekIndex + Math.floor((weekday + day - 1) / 7)
}

export function buildYearWatchGrid(
  year: number,
  watchesByDate: ReadonlyMap<string, number>,
  timeZone: string,
): { cells: (YearGridCell | null)[][]; weekCount: number } {
  let weekday = calendarWeekday(`${year}-01-01`, timeZone)
  let weekIndex = 0
  const cells: (YearGridCell | null)[][] = Array.from({ length: 7 }, () => [])

  const ensureWeek = (index: number): void => {
    for (const row of cells) {
      while (row.length <= index) {
        row.push(null)
      }
    }
  }

  for (let month = 1; month <= 12; month += 1) {
    const dim = daysInMonth(year, month)

    for (let day = 1; day <= dim; day += 1) {
      ensureWeek(weekIndex)
      const date = `${String(year)}-${pad(month)}-${pad(day)}`
      const watchCount = watchesByDate.get(date) ?? 0
      const row = cells[weekday]
      if (row) {
        row[weekIndex] = {
          date,
          month,
          day,
          active: watchCount > 0,
          watchCount,
        }
      }

      weekday += 1
      if (weekday === 7) {
        weekday = 0
        weekIndex += 1
      }
    }
  }

  return { cells, weekCount: cells[0]?.length ?? 0 }
}

export function isFutureYear(
  year: number,
  timeZone: string,
  now: Date = new Date(),
): boolean {
  return year > currentYearInTimeZone(timeZone, now)
}
