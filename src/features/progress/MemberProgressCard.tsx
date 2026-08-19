import { ProgressBar } from '@/components/ProgressBar'
import { Badge } from '@/components/ui/badge'
import type { GroupMember } from '@/features/groups/group-schemas'
import {
  completionPercent,
  memberWatchingTitle,
  progressStatusFor,
  watchedTitleCount,
} from '@/features/progress/progress-metrics'
import type { GroupProgressRow } from '@/features/progress/progress-schemas'
import {
  TITLE_STATUS_LABEL,
  type TitleRow,
  type TitleStatus,
} from '@/features/watchlist/title-schemas'
import { cn } from '@/lib/utils'

type MemberProgressCardProps = {
  member: GroupMember
  titles: readonly TitleRow[]
  progress: readonly GroupProgressRow[]
  currentTitleId: string | null
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  const letters = parts
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return letters || '?'
}

function statusTone(status: TitleStatus) {
  if (status === 'watching') {
    return 'watching' as const
  }

  if (status === 'watched') {
    return 'watched' as const
  }

  return 'notStarted' as const
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
  const watching = memberWatchingTitle(progress, member.user_id, titles)
  const currentStatus = currentTitleId
    ? progressStatusFor(progress, member.user_id, currentTitleId)
    : null

  return (
    <article className="elevated-card space-y-3 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={cn(
            'inline-flex size-10 items-center justify-center rounded-full border text-sm font-medium',
            member.role === 'owner'
              ? 'border-accent/40 bg-accent/15 text-heading'
              : 'border-border bg-surface-elevated text-heading',
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
          <Badge tone={statusTone(currentStatus)}>
            {TITLE_STATUS_LABEL[currentStatus]}
          </Badge>
        </p>
      ) : watching ? (
        <p className="text-sm text-secondary">Watching {watching.name}</p>
      ) : (
        <p className="text-sm text-secondary">Not started</p>
      )}
    </article>
  )
}
