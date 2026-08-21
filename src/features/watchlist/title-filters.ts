import { z } from 'zod'
import {
  importanceSchema,
  mediaTypeSchema,
  type Importance,
  type MediaType,
  type TitleProgress,
  type TitleRow,
  type TitleStatus,
} from '@/features/watchlist/title-schemas'

export const watchlistSortSchema = z.enum(['doomsday', 'release'])
export const watchlistStatusFilterSchema = z.enum([
  'all',
  'unwatched',
  'watched',
])
export const watchlistTypeFilterSchema = z.enum(['all', 'movie', 'series', 'special'])
export const watchlistImportanceFilterSchema = z.enum([
  'all',
  'essential',
  'recommended',
  'optional',
])

export const watchlistFiltersSchema = z.object({
  q: z.string(),
  type: watchlistTypeFilterSchema,
  importance: watchlistImportanceFilterSchema,
  status: watchlistStatusFilterSchema,
  sort: watchlistSortSchema,
  showRating: z.boolean(),
  showReviews: z.boolean(),
  showSkipped: z.boolean(),
})

export type WatchlistSort = z.infer<typeof watchlistSortSchema>
export type WatchlistStatusFilter = z.infer<typeof watchlistStatusFilterSchema>
export type WatchlistFilters = z.infer<typeof watchlistFiltersSchema>

export const DEFAULT_WATCHLIST_FILTERS: WatchlistFilters = {
  q: '',
  type: 'all',
  importance: 'all',
  status: 'all',
  sort: 'doomsday',
  showRating: true,
  showReviews: true,
  showSkipped: false,
}

export function countActiveWatchlistFilters(filters: WatchlistFilters): number {
  let count = 0

  if (filters.q.trim()) {
    count += 1
  }

  if (filters.type !== DEFAULT_WATCHLIST_FILTERS.type) {
    count += 1
  }

  if (filters.importance !== DEFAULT_WATCHLIST_FILTERS.importance) {
    count += 1
  }

  if (filters.status !== DEFAULT_WATCHLIST_FILTERS.status) {
    count += 1
  }

  if (filters.sort !== DEFAULT_WATCHLIST_FILTERS.sort) {
    count += 1
  }

  if (filters.showRating !== DEFAULT_WATCHLIST_FILTERS.showRating) {
    count += 1
  }

  if (filters.showReviews !== DEFAULT_WATCHLIST_FILTERS.showReviews) {
    count += 1
  }

  if (filters.showSkipped !== DEFAULT_WATCHLIST_FILTERS.showSkipped) {
    count += 1
  }

  return count
}

function readBoolean(value: string | null, fallback: boolean): boolean {
  if (value === '0' || value === 'false') {
    return false
  }

  if (value === '1' || value === 'true') {
    return true
  }

  return fallback
}

function readEnum<T extends z.ZodType>(
  schema: T,
  value: string | null,
  fallback: z.infer<T>,
): z.infer<T> {
  const parsed = schema.safeParse(value)
  return parsed.success ? parsed.data : fallback
}

export function parseWatchlistFilters(
  params: URLSearchParams,
): WatchlistFilters {
  return {
    q: params.get('q')?.trim() ?? '',
    type: readEnum(
      watchlistTypeFilterSchema,
      params.get('type'),
      DEFAULT_WATCHLIST_FILTERS.type,
    ),
    importance: readEnum(
      watchlistImportanceFilterSchema,
      params.get('importance'),
      DEFAULT_WATCHLIST_FILTERS.importance,
    ),
    status: readEnum(
      watchlistStatusFilterSchema,
      params.get('status'),
      DEFAULT_WATCHLIST_FILTERS.status,
    ),
    sort: readEnum(
      watchlistSortSchema,
      params.get('sort'),
      DEFAULT_WATCHLIST_FILTERS.sort,
    ),
    showRating: readBoolean(
      params.get('showRating'),
      DEFAULT_WATCHLIST_FILTERS.showRating,
    ),
    showReviews: readBoolean(
      params.get('showReviews'),
      DEFAULT_WATCHLIST_FILTERS.showReviews,
    ),
    showSkipped: readBoolean(
      params.get('showSkipped'),
      DEFAULT_WATCHLIST_FILTERS.showSkipped,
    ),
  }
}

export function serializeWatchlistFilters(
  filters: WatchlistFilters,
): URLSearchParams {
  const params = new URLSearchParams()

  if (filters.q) {
    params.set('q', filters.q)
  }

  if (filters.type !== DEFAULT_WATCHLIST_FILTERS.type) {
    params.set('type', filters.type)
  }

  if (filters.importance !== DEFAULT_WATCHLIST_FILTERS.importance) {
    params.set('importance', filters.importance)
  }

  if (filters.status !== DEFAULT_WATCHLIST_FILTERS.status) {
    params.set('status', filters.status)
  }

  if (filters.sort !== DEFAULT_WATCHLIST_FILTERS.sort) {
    params.set('sort', filters.sort)
  }

  if (filters.showRating !== DEFAULT_WATCHLIST_FILTERS.showRating) {
    params.set('showRating', filters.showRating ? '1' : '0')
  }

  if (filters.showReviews !== DEFAULT_WATCHLIST_FILTERS.showReviews) {
    params.set('showReviews', filters.showReviews ? '1' : '0')
  }

  if (filters.showSkipped !== DEFAULT_WATCHLIST_FILTERS.showSkipped) {
    params.set('showSkipped', filters.showSkipped ? '1' : '0')
  }

  return params
}

export function statusForTitle(
  titleId: string,
  progress: readonly TitleProgress[],
): TitleStatus {
  return (
    progress.find((row) => row.title_id === titleId)?.status ?? 'not_started'
  )
}

export function filterTitles(
  titles: readonly TitleRow[],
  progress: readonly TitleProgress[],
  filters: WatchlistFilters,
  skippedTitleIds: ReadonlySet<string> = new Set(),
): TitleRow[] {
  const query = filters.q.trim().toLowerCase()

  const filtered = titles.filter((title) => {
    if (!title.is_active) {
      return false
    }

    if (filters.sort === 'doomsday' && title.doomsday_order == null) {
      return false
    }

    if (skippedTitleIds.has(title.id) && !filters.showSkipped) {
      return false
    }

    if (query && !title.name.toLowerCase().includes(query)) {
      return false
    }

    if (filters.type !== 'all' && title.media_type !== filters.type) {
      return false
    }

    if (
      filters.importance !== 'all' &&
      title.importance !== filters.importance
    ) {
      return false
    }

    const status = statusForTitle(title.id, progress)

    if (filters.status === 'unwatched' && status === 'watched') {
      return false
    }

    if (filters.status === 'watched' && status !== 'watched') {
      return false
    }

    return true
  })

  return [...filtered].sort((left, right) => {
    if (filters.sort === 'release') {
      return left.release_order - right.release_order
    }

    const leftOrder = left.doomsday_order ?? Number.MAX_SAFE_INTEGER
    const rightOrder = right.doomsday_order ?? Number.MAX_SAFE_INTEGER
    return leftOrder - rightOrder
  })
}

export function isMediaType(value: string): value is MediaType {
  return mediaTypeSchema.safeParse(value).success
}

export function isImportance(value: string): value is Importance {
  return importanceSchema.safeParse(value).success
}

export function isWatchlistTypeFilter(
  value: string,
): value is WatchlistFilters['type'] {
  return watchlistTypeFilterSchema.safeParse(value).success
}

export function isWatchlistImportanceFilter(
  value: string,
): value is WatchlistFilters['importance'] {
  return watchlistImportanceFilterSchema.safeParse(value).success
}

export function isWatchlistStatusFilter(
  value: string,
): value is WatchlistFilters['status'] {
  return watchlistStatusFilterSchema.safeParse(value).success
}

export function isWatchlistSort(value: string): value is WatchlistSort {
  return watchlistSortSchema.safeParse(value).success
}
