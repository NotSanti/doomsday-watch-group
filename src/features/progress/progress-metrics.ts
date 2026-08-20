import type { TitleRow, TitleStatus } from '@/features/watchlist/title-schemas'

export type ProgressStatusRow = {
  user_id: string
  title_id: string
  status: TitleStatus
}

export function progressStatusFor(
  rows: readonly ProgressStatusRow[],
  userId: string,
  titleId: string,
): TitleStatus {
  return (
    rows.find((row) => row.user_id === userId && row.title_id === titleId)
      ?.status ?? 'not_started'
  )
}

export function watchedTitleCount(
  rows: readonly ProgressStatusRow[],
  userId: string,
  activeTitleIds: ReadonlySet<string>,
): number {
  return rows.filter(
    (row) =>
      row.user_id === userId &&
      row.status === 'watched' &&
      activeTitleIds.has(row.title_id),
  ).length
}

export function completionPercent(watched: number, total: number): number {
  if (total <= 0) {
    return 0
  }

  return (watched / total) * 100
}

export function titlesCompletedAsAGroup(
  activeTitleIds: readonly string[],
  memberIds: readonly string[],
  rows: readonly ProgressStatusRow[],
): number {
  if (memberIds.length === 0) {
    return 0
  }

  return activeTitleIds.filter((titleId) =>
    memberIds.every(
      (memberId) => progressStatusFor(rows, memberId, titleId) === 'watched',
    ),
  ).length
}

export function groupWatchlistCompletionPercent(
  activeTitleIds: readonly string[],
  memberIds: readonly string[],
  rows: readonly ProgressStatusRow[],
): number {
  if (activeTitleIds.length === 0) {
    return 0
  }

  return completionPercent(
    titlesCompletedAsAGroup(activeTitleIds, memberIds, rows),
    activeTitleIds.length,
  )
}

export function averageCompletionPercent(
  memberIds: readonly string[],
  activeTitleCount: number,
  rows: readonly ProgressStatusRow[],
  activeTitleIds: ReadonlySet<string>,
): number {
  if (memberIds.length === 0 || activeTitleCount <= 0) {
    return 0
  }

  const total = memberIds.reduce((sum, memberId) => {
    return (
      sum +
      completionPercent(
        watchedTitleCount(rows, memberId, activeTitleIds),
        activeTitleCount,
      )
    )
  }, 0)

  return total / memberIds.length
}

export function groupWatchedFraction(
  titleId: string,
  memberIds: readonly string[],
  rows: readonly ProgressStatusRow[],
): { watched: number; total: number } {
  const total = memberIds.length
  const watched = memberIds.filter(
    (memberId) => progressStatusFor(rows, memberId, titleId) === 'watched',
  ).length

  return { watched, total }
}

export function currentTitleCompletionPercent(
  currentTitleId: string | null,
  memberIds: readonly string[],
  rows: readonly ProgressStatusRow[],
): number | null {
  if (!currentTitleId || memberIds.length === 0) {
    return null
  }

  const { watched, total } = groupWatchedFraction(
    currentTitleId,
    memberIds,
    rows,
  )
  return completionPercent(watched, total)
}

export function upcomingTitles(
  titles: readonly TitleRow[],
  currentTitleId: string | null,
  limit = 3,
): TitleRow[] {
  const ordered = titles
    .filter((title) => title.is_active && title.doomsday_order !== null)
    .slice()
    .sort(
      (left, right) => (left.doomsday_order ?? 0) - (right.doomsday_order ?? 0),
    )

  if (!currentTitleId) {
    return ordered.slice(0, limit)
  }

  const currentIndex = ordered.findIndex((title) => title.id === currentTitleId)
  if (currentIndex === -1) {
    return ordered.slice(0, limit)
  }

  return ordered.slice(currentIndex + 1, currentIndex + 1 + limit)
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}

export function formatWatchedFraction(watched: number, total: number): string {
  return `${String(watched)}/${String(total)} watched`
}
