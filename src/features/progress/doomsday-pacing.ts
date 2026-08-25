import type { GroupProgressRow } from '@/features/progress/progress-schemas'
import { progressStatusFor } from '@/features/progress/progress-metrics'
import type { TitleRow } from '@/features/watchlist/title-schemas'
import { calendarDateInTimeZone } from '@/lib/timezone'

export const DEFAULT_SERIES_EPISODE_MINUTES = 45
const MS_PER_DAY = 24 * 60 * 60 * 1000

export type DoomsdayPacingInput = {
  titles: readonly TitleRow[]
  skippedTitleIds: ReadonlySet<string>
  memberIds: readonly string[]
  progress: readonly Pick<
    GroupProgressRow,
    'user_id' | 'title_id' | 'status' | 'watched_at'
  >[]
  targetDateIso: string
  timeZone: string
  now?: Date
}

export type DoomsdayPacing = {
  remainingTitleCount: number
  completedTodayCount: number
  remainingHours: number
  daysUntilDoomsday: number
  titlesPerDay: number
}

export function doomsdayPathTitles(
  titles: readonly TitleRow[],
  skippedTitleIds: ReadonlySet<string>,
): TitleRow[] {
  return titles.filter(
    (title) =>
      title.is_active &&
      title.doomsday_order != null &&
      !skippedTitleIds.has(title.id),
  )
}

export function titleWatchMinutes(title: TitleRow): number {
  if (title.media_type === 'series') {
    if (title.runtime_minutes) {
      return title.runtime_minutes
    }

    if (title.episode_count) {
      return title.episode_count * DEFAULT_SERIES_EPISODE_MINUTES
    }

    return 0
  }

  return title.runtime_minutes ?? 0
}

export function calendarDaysUntil(
  nowIso: string,
  targetIso: string,
  timeZone: string,
): number {
  const today = calendarDateInTimeZone(nowIso, timeZone)
  const target = calendarDateInTimeZone(targetIso, timeZone)
  const todayParts = today.split('-').map(Number)
  const targetParts = target.split('-').map(Number)
  const todayUtc = Date.UTC(todayParts[0] ?? 0, (todayParts[1] ?? 1) - 1, todayParts[2] ?? 1)
  const targetUtc = Date.UTC(
    targetParts[0] ?? 0,
    (targetParts[1] ?? 1) - 1,
    targetParts[2] ?? 1,
  )

  return Math.max(0, Math.round((targetUtc - todayUtc) / MS_PER_DAY))
}

function isGroupComplete(
  titleId: string,
  memberIds: readonly string[],
  progress: DoomsdayPacingInput['progress'],
): boolean {
  if (memberIds.length === 0) {
    return false
  }

  return memberIds.every(
    (memberId) => progressStatusFor(progress, memberId, titleId) === 'watched',
  )
}

function groupCompletedAt(
  titleId: string,
  memberIds: readonly string[],
  progress: DoomsdayPacingInput['progress'],
): string | null {
  if (!isGroupComplete(titleId, memberIds, progress)) {
    return null
  }

  const stamps: string[] = []

  for (const memberId of memberIds) {
    const watchedAt = progress.find(
      (row) => row.user_id === memberId && row.title_id === titleId,
    )?.watched_at

    if (!watchedAt) {
      return null
    }

    stamps.push(watchedAt)
  }

  return stamps.sort().at(-1) ?? null
}

export function computeDoomsdayPacing({
  titles,
  skippedTitleIds,
  memberIds,
  progress,
  targetDateIso,
  timeZone,
  now = new Date(),
}: DoomsdayPacingInput): DoomsdayPacing {
  const pathTitles = doomsdayPathTitles(titles, skippedTitleIds)
  const nowIso = now.toISOString()
  const today = calendarDateInTimeZone(nowIso, timeZone)
  const remainingTitles = pathTitles.filter(
    (title) => !isGroupComplete(title.id, memberIds, progress),
  )
  const completedTodayCount = pathTitles.filter((title) => {
    const completedAt = groupCompletedAt(title.id, memberIds, progress)
    return completedAt !== null && calendarDateInTimeZone(completedAt, timeZone) === today
  }).length
  const remainingMinutes = remainingTitles.reduce(
    (sum, title) => sum + titleWatchMinutes(title),
    0,
  )
  const remainingAtStart = remainingTitles.length + completedTodayCount
  const daysUntilDoomsday = calendarDaysUntil(nowIso, targetDateIso, timeZone)
  const startOfDayQuota = startOfDayTitlesRequired(
    remainingAtStart,
    daysUntilDoomsday,
  )
  const titlesPerDay = Math.max(
    0,
    Math.round((startOfDayQuota - completedTodayCount) * 10) / 10,
  )

  return {
    remainingTitleCount: remainingTitles.length,
    completedTodayCount,
    remainingHours: Math.round(remainingMinutes / 60),
    daysUntilDoomsday,
    titlesPerDay,
  }
}

function startOfDayTitlesRequired(
  remainingAtStart: number,
  daysUntilDoomsday: number,
): number {
  const raw =
    daysUntilDoomsday <= 0
      ? remainingAtStart
      : remainingAtStart / daysUntilDoomsday

  if (raw <= 0) {
    return 0
  }

  if (raw < 1) {
    return 1
  }

  return Math.round(raw * 10) / 10
}

export function formatHoursLeft(hours: number): string {
  const rounded = Math.round(hours)
  return `${String(rounded)} ${rounded === 1 ? 'hour' : 'hours'}`
}

export function formatDailyPace(titlesPerDay: number): string {
  return Number.isInteger(titlesPerDay)
    ? String(titlesPerDay)
    : titlesPerDay.toFixed(1)
}
