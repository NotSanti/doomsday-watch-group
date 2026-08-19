import { ProgressBar } from '@/components/ProgressBar'
import { Badge } from '@/components/ui/badge'
import type { GroupMember } from '@/features/groups/group-schemas'
import {
  completionPercent,
  progressStatusFor,
  watchedTitleCount,
} from '@/features/progress/progress-metrics'
import type { GroupProgressRow } from '@/features/progress/progress-schemas'
import {
  TITLE_STATUS_LABEL,
  isTitleWatched,
  type TitleRow,
} from '@/features/watchlist/title-schemas'
import { chipClasses } from '@/lib/chip-styles'
import { cn } from '@/lib/utils'

type MemberProgressCardProps = {
  member: GroupMember
  titles: readonly TitleRow[]
  progress: readonly GroupProgressRow[]
  currentTitleId: string | null
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  const letters = parts.map((part) => part[0]?.toUpperCase() ?? '').join('')

  return letters || '?'
}

export function MemberProgressCard({
  member,
  titles,
  progress,
  currentTitleId,
}: MemberProgressCardProps) {
  const activeIds = new Set(titles.map((title) => title.id))
  const watched = watchedTitleCount(progress, member.user_id, activeIds)
  const percent = completionPercent(watched, titles.length)
  const currentStatus = currentTitleId
    ? progressStatusFor(progress, member.user_id, currentTitleId)
    : null

  return (
    <article className="elevated-card space-y-3 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={cn(
            chipClasses(member.role === 'owner' ? 'gold' : 'metal', 'pill'),
            'size-10 justify-center rounded-full px-0 text-sm',
          )}
        >
          {initials(member.display_name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-heading">{member.display_name}</p>
          <p className="text-xs text-muted">
            {watched} of {titles.length} watched
          </p>
        </div>
      </div>
      <ProgressBar
        value={percent}
        label={`${member.display_name} completion`}
      />
      {currentStatus ? (
        <p className="text-sm text-secondary">
          Current title:{' '}
          <Badge
            tone={isTitleWatched(currentStatus) ? 'watched' : 'notStarted'}
          >
            {TITLE_STATUS_LABEL[currentStatus]}
          </Badge>
        </p>
      ) : (
        <p className="text-sm text-secondary">Not watching</p>
      )}
    </article>
  )
}
