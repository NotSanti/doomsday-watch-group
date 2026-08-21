import { z } from 'zod'

export const titleIdSchema = z.string().uuid()

export const mediaTypeSchema = z.enum(['movie', 'series', 'special'])
export const importanceSchema = z.enum(['essential', 'recommended', 'optional'])
export const titleStatusSchema = z.enum(['not_started', 'watching', 'watched'])

export const titleRowSchema = z.object({
  id: z.string().uuid(),
  tmdb_id: z.number().int().nullable(),
  media_type: mediaTypeSchema,
  name: z.string().min(1),
  release_date: z.string().nullable(),
  runtime_minutes: z.number().int().positive().nullable(),
  episode_count: z.number().int().positive().nullable(),
  poster_path: z.string().nullable(),
  backdrop_path: z.string().nullable(),
  synopsis: z.string().nullable(),
  phase: z.number().int().nullable(),
  saga: z.string().nullable(),
  era: z.string().min(1).nullable(),
  importance: importanceSchema,
  release_order: z.number().int(),
  doomsday_order: z.number().int().nullable(),
  is_active: z.boolean(),
})

export const titleProgressSchema = z.object({
  title_id: z.string().uuid(),
  status: titleStatusSchema,
})

export type MediaType = z.infer<typeof mediaTypeSchema>
export type Importance = z.infer<typeof importanceSchema>
export type TitleStatus = z.infer<typeof titleStatusSchema>
export type TitleRow = z.infer<typeof titleRowSchema>
export type TitleProgress = z.infer<typeof titleProgressSchema>

export const MEDIA_TYPE_LABEL: Record<MediaType, string> = {
  movie: 'Movie',
  series: 'Series',
  special: 'Special',
}

export const MEDIA_TYPE_CHIP_LABEL: Record<MediaType, string> = {
  movie: 'FILM',
  series: 'TV',
  special: 'SPC',
}

export const IMPORTANCE_LABEL: Record<Importance, string> = {
  essential: 'Essential',
  recommended: 'Recommended',
  optional: 'Optional',
}

export const TITLE_STATUS_LABEL: Record<TitleStatus, string> = {
  not_started: 'Not watched',
  watching: 'Not watched',
  watched: 'Watched',
}

export function isTitleWatched(status: TitleStatus): boolean {
  return status === 'watched'
}

export function isTitleId(value: string): boolean {
  return titleIdSchema.safeParse(value).success
}

export function titleYear(releaseDate: string | null): string | null {
  if (!releaseDate) {
    return null
  }

  const year = releaseDate.slice(0, 4)
  return /^\d{4}$/.test(year) ? year : null
}

export function titleRuntimeLabel(title: TitleRow): string | null {
  if (title.media_type === 'series' && title.episode_count) {
    return `${title.episode_count} episodes`
  }

  if (title.runtime_minutes) {
    return `${title.runtime_minutes} min`
  }

  return null
}

export function sequenceForTitle(
  title: TitleRow,
  sort: 'doomsday' | 'release',
): number {
  if (sort === 'release') {
    return title.release_order
  }

  return title.doomsday_order ?? title.release_order
}
