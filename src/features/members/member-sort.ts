import { z } from 'zod'
import type { GroupMember } from '@/features/groups/group-schemas'
import {
  completionPercent,
  watchedTitleCount,
} from '@/features/progress/progress-metrics'
import type { GroupProgressRow } from '@/features/progress/progress-schemas'
import type { TitleRow } from '@/features/watchlist/title-schemas'

export const memberSortSchema = z.enum(['completion', 'recent', 'name'])
export type MemberSort = z.infer<typeof memberSortSchema>

export function isMemberSort(value: string): value is MemberSort {
  return memberSortSchema.safeParse(value).success
}

function lastActiveAt(
  member: GroupMember,
  progress: readonly GroupProgressRow[],
): string {
  const stamps = progress
    .filter((row) => row.user_id === member.user_id)
    .flatMap((row) => [row.watched_at, row.started_at])
    .filter((value): value is string => Boolean(value))

  return [member.joined_at, ...stamps].sort().at(-1) ?? member.joined_at
}

export function sortGroupMembers(
  members: readonly GroupMember[],
  titles: readonly TitleRow[],
  progress: readonly GroupProgressRow[],
  sort: MemberSort,
  skippedTitleIds: ReadonlySet<string> = new Set(),
): GroupMember[] {
  const pathTitles = titles.filter((title) => !skippedTitleIds.has(title.id))
  const activeIds = new Set(pathTitles.map((title) => title.id))
  const copy = [...members]

  copy.sort((left, right) => {
    if (sort === 'name') {
      return left.display_name.localeCompare(right.display_name)
    }

    if (sort === 'recent') {
      return lastActiveAt(right, progress).localeCompare(
        lastActiveAt(left, progress),
      )
    }

    const leftPercent = completionPercent(
      watchedTitleCount(progress, left.user_id, activeIds),
      pathTitles.length,
    )
    const rightPercent = completionPercent(
      watchedTitleCount(progress, right.user_id, activeIds),
      pathTitles.length,
    )

    if (leftPercent !== rightPercent) {
      return rightPercent - leftPercent
    }

    return left.display_name.localeCompare(right.display_name)
  })

  return copy
}
