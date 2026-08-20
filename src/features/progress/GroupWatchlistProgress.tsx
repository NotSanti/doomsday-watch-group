import { ProgressBar } from '@/components/ProgressBar'
import {
  groupWatchlistCompletionPercent,
  type ProgressStatusRow,
} from '@/features/progress/progress-metrics'

type GroupWatchlistProgressProps = {
  activeTitleIds: readonly string[]
  memberIds: readonly string[]
  progress: readonly ProgressStatusRow[]
}

export function GroupWatchlistProgress({
  activeTitleIds,
  memberIds,
  progress,
}: GroupWatchlistProgressProps) {
  const percent = groupWatchlistCompletionPercent(
    activeTitleIds,
    memberIds,
    progress,
  )

  return (
    <article className="elevated-card rounded-xl p-4">
      <ProgressBar value={percent} label="COMPLETION" />
    </article>
  )
}
