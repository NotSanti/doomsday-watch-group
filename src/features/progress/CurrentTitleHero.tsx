import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusControl } from '@/features/progress/StatusControl'
import { TitleArtwork } from '@/features/watchlist/TitleArtwork'
import {
  IMPORTANCE_LABEL,
  MEDIA_TYPE_LABEL,
  sequenceForTitle,
  titleRuntimeLabel,
  titleYear,
  type TitleRow,
  type TitleStatus,
} from '@/features/watchlist/title-schemas'

type CurrentTitleHeroProps = {
  groupId: string
  title: TitleRow
  status: TitleStatus
  groupWatchedLabel: string
  isOwner: boolean
  statusDisabled?: boolean
  onStatusChange: (status: TitleStatus) => void
  onChangeCurrentTitle: () => void
}

export function CurrentTitleHero({
  groupId,
  title,
  status,
  groupWatchedLabel,
  isOwner,
  statusDisabled = false,
  onStatusChange,
  onChangeCurrentTitle,
}: CurrentTitleHeroProps) {
  const year = titleYear(title.release_date)
  const runtime = titleRuntimeLabel(title)
  const sequence = sequenceForTitle(title, 'doomsday')

  return (
    <Card className="grid gap-6 p-4 md:grid-cols-[10rem_minmax(0,1fr)] md:p-6">
      <TitleArtwork
        path={title.poster_path}
        alt={`${title.name} poster`}
        className="rounded-xl"
      />
      <div className="space-y-4">
        <p className="text-xs tracking-[0.14em] text-secondary uppercase">
          Current title · Doomsday {String(sequence).padStart(2, '0')}
        </p>
        <h2 className="font-display text-3xl tracking-[0.08em] text-heading uppercase">
          {title.name}
        </h2>
        <p className="text-sm text-muted">
          {[year, MEDIA_TYPE_LABEL[title.media_type], runtime]
            .filter(Boolean)
            .join(' · ')}
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge>{IMPORTANCE_LABEL[title.importance]}</Badge>
          <Badge tone="muted">{groupWatchedLabel}</Badge>
        </div>
        {title.synopsis ? (
          <p className="max-w-2xl text-sm text-muted">{title.synopsis}</p>
        ) : null}
        <StatusControl
          value={status}
          disabled={statusDisabled}
          onChange={onStatusChange}
        />
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <Link to={`/groups/${groupId}/titles/${title.id}`}>
              Open title
            </Link>
          </Button>
          {isOwner ? (
            <Button variant="secondary" onClick={onChangeCurrentTitle}>
              Change current title
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
