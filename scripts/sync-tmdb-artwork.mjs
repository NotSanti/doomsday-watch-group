/**
 * Refresh stored TMDB poster/backdrop paths for the curated catalog.
 * Requires TMDB_API_READ_TOKEN in `.env` (never VITE_, never Vercel).
 *
 * Usage: node --env-file=.env scripts/sync-tmdb-artwork.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CATALOG_FILES = [
  'supabase/migrations/20260819001500_mcu_catalog.sql',
  'supabase/migrations/20260819020000_doomsday_path_order.sql',
]
const ARTWORK_FILE = 'supabase/migrations/20260819090000_title_artwork.sql'
const TITLE_ROW =
  /\(\s*\n\s*'(aa000000-0000-4000-8000-[0-9a-f]+)',\s*\n\s*(\d+),\s*\n\s*'([^']+)',\s*\n\s*'([^']+)'/g

const token = process.env.TMDB_API_READ_TOKEN?.trim()

if (!token) {
  console.error(
    'Set TMDB_API_READ_TOKEN in .env (server/script only) before syncing artwork.',
  )
  process.exit(1)
}

function catalogTitles() {
  const text = CATALOG_FILES.map((file) =>
    readFileSync(join(ROOT, file), 'utf8'),
  ).join('\n')
  return [...text.matchAll(TITLE_ROW)].map((match) => ({
    id: match[1],
    tmdbId: Number(match[2]),
    mediaType: match[3],
    name: match[4],
  }))
}

function resourceFor(title) {
  if (title.name === 'Agent Carter') {
    return { kind: 'season', season: 1 }
  }
  if (title.name === 'Agent Carter (Season 2)') {
    return { kind: 'season', season: 2 }
  }
  if (title.name === 'Loki') {
    return { kind: 'season', season: 1 }
  }
  if (title.name === 'Loki (Season 2)') {
    return { kind: 'season', season: 2 }
  }
  if (title.mediaType === 'series') {
    return { kind: 'tv' }
  }
  return { kind: 'movie' }
}

async function tmdbJson(path) {
  const response = await fetch(`https://api.themoviedb.org/3${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`${path} → ${response.status}`)
  }

  return await response.json()
}

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`
}

async function artworkFor(title) {
  const resource = resourceFor(title)

  if (resource.kind === 'season') {
    const season = await tmdbJson(
      `/tv/${title.tmdbId}/season/${resource.season}`,
    )
    const series = await tmdbJson(`/tv/${title.tmdbId}`)
    return {
      poster: season.poster_path ?? series.poster_path,
      backdrop: season.backdrop_path ?? series.backdrop_path,
    }
  }

  if (resource.kind === 'tv') {
    const series = await tmdbJson(`/tv/${title.tmdbId}`)
    return { poster: series.poster_path, backdrop: series.backdrop_path }
  }

  try {
    const movie = await tmdbJson(`/movie/${title.tmdbId}`)
    return { poster: movie.poster_path, backdrop: movie.backdrop_path }
  } catch {
    const series = await tmdbJson(`/tv/${title.tmdbId}`)
    return { poster: series.poster_path, backdrop: series.backdrop_path }
  }
}

function printSql(rows) {
  const lines = [
    '-- Store TMDB poster and backdrop file paths for every curated catalog title.',
    '-- Artwork URLs are built at runtime from these paths; the client never calls TMDB.',
    '',
  ]

  for (const row of rows) {
    if (!row.poster?.startsWith('/') || !row.backdrop?.startsWith('/')) {
      throw new Error(`Incomplete TMDB artwork for ${row.name}`)
    }

    lines.push(`-- ${row.name}`)
    lines.push('update public.titles')
    lines.push('set')
    lines.push(`  poster_path = ${sqlLiteral(row.poster)},`)
    lines.push(`  backdrop_path = ${sqlLiteral(row.backdrop)}`)
    lines.push(`where id = ${sqlLiteral(row.id)};`)
    lines.push('')
  }

  return lines.join('\n')
}

const titles = catalogTitles()
const rows = []

for (const [index, title] of titles.entries()) {
  process.stderr.write(`[${index + 1}/${titles.length}] ${title.name}\n`)
  const paths = await artworkFor(title)
  rows.push({ ...title, ...paths })
}

const sql = printSql(rows)
writeFileSync(join(ROOT, ARTWORK_FILE), sql, 'utf8')
process.stderr.write(`Updated ${ARTWORK_FILE}\n`)
