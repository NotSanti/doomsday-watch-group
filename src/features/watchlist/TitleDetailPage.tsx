import { Link, useLocation, useParams } from 'react-router'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toFriendlyTitleDetailError } from '@/features/watchlist/title-errors'
import {
  IMPORTANCE_LABEL,
  MEDIA_TYPE_LABEL,
  isTitleId,
  titleRuntimeLabel,
  titleYear,
} from '@/features/watchlist/title-schemas'
import { TitleArtwork } from '@/features/watchlist/TitleArtwork'
import { TmdbCredit } from '@/features/watchlist/TmdbCredit'
import { useTitle } from '@/features/watchlist/use-titles'

export function TitleDetailPage() {
  const { groupId = '', titleId = '' } = useParams()
  const location = useLocation()
  const titleQuery = useTitle(titleId)
  const canFetch = isTitleId(titleId)
  const watchlistHref = `/groups/${groupId}/watchlist${location.search}`

  if (!canFetch) {
    return (
      <EmptyState
        title="Title not available"
        description="This title is not in the catalog."
        action={
          <Button asChild>
            <Link to={watchlistHref}>Back to watchlist</Link>
          </Button>
        }
      />
    )
  }

  if (titleQuery.isPending) {
    return (
      <div role="status" aria-live="polite">
        <span className="sr-only">Loading title</span>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="mt-4 h-10 w-64" />
      </div>
    )
  }

  if (titleQuery.isError) {
    return (
      <ErrorState
        message={toFriendlyTitleDetailError()}
        onRetry={() => {
          void titleQuery.refetch()
        }}
      />
    )
  }

  const title = titleQuery.data

  if (!title) {
    return (
      <EmptyState
        title="Title not available"
        description="This title is not in the catalog."
        action={
          <Button asChild>
            <Link to={watchlistHref}>Back to watchlist</Link>
          </Button>
        }
      />
    )
  }

  const year = titleYear(title.release_date)
  const runtime = titleRuntimeLabel(title)

  return (
    <article className="space-y-6">
      <TitleArtwork
        path={title.backdrop_path ?? title.poster_path}
        alt=""
        kind="backdrop"
        className="rounded-xl"
      />
      <div className="grid gap-6 md:grid-cols-[12rem_minmax(0,1fr)]">
        <TitleArtwork
          path={title.poster_path}
          alt={`${title.name} poster`}
          className="hidden rounded-xl md:block"
        />
        <div className="space-y-4">
          <p className="text-xs tracking-[0.14em] text-secondary uppercase">
            {[year, MEDIA_TYPE_LABEL[title.media_type], runtime]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <h1 className="font-display text-3xl tracking-[0.08em] text-heading uppercase">
            {title.name}
          </h1>
          <div className="flex flex-wrap gap-2">
            <Badge>{IMPORTANCE_LABEL[title.importance]}</Badge>
            {title.phase ? <Badge tone="muted">Phase {title.phase}</Badge> : null}
            {title.saga ? <Badge tone="muted">{title.saga}</Badge> : null}
          </div>
          {title.synopsis ? (
            <p className="max-w-2xl text-muted">{title.synopsis}</p>
          ) : (
            <p className="text-sm text-muted">No synopsis yet.</p>
          )}
          <p className="text-sm text-secondary">
            Personal status, ratings, and reviews arrive in later milestones.
          </p>
          <Button asChild variant="secondary">
            <Link to={watchlistHref}>Back to watchlist</Link>
          </Button>
        </div>
      </div>
      <TmdbCredit className="text-xs text-muted" />
    </article>
  )
}
