const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

export const TMDB_POSTER_SIZE = 'w342'
export const TMDB_BACKDROP_SIZE = 'w780'

export function tmdbImageUrl(
  path: string | null | undefined,
  size: typeof TMDB_POSTER_SIZE | typeof TMDB_BACKDROP_SIZE | 'original' = TMDB_POSTER_SIZE,
): string | null {
  if (!path) {
    return null
  }

  const trimmed = path.trim()

  if (!trimmed.startsWith('/')) {
    return null
  }

  return `${TMDB_IMAGE_BASE}/${size}${trimmed}`
}
