import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { tmdbImageUrl } from '@/lib/tmdb-image'

const CATALOG_FILES = [
  'supabase/migrations/20260819001500_mcu_catalog.sql',
  'supabase/migrations/20260819020000_doomsday_path_order.sql',
]
const ARTWORK_FILE = 'supabase/migrations/20260819090000_title_artwork.sql'
const TITLE_ID = /'(aa000000-0000-4000-8000-[0-9a-f]{12})'/g
const ARTWORK_UPDATE =
  /poster_path = '(\/[^']+\.jpg)',\s*backdrop_path = '(\/[^']+\.jpg)'\s*where id = '(aa000000-0000-4000-8000-[0-9a-f]{12})'/g

function catalogTitleIds(): string[] {
  const ids = new Set<string>()

  for (const file of CATALOG_FILES) {
    const text = readFileSync(join(process.cwd(), file), 'utf8')
    for (const match of text.matchAll(TITLE_ID)) {
      const id = match[1]
      if (id) {
        ids.add(id)
      }
    }
  }

  return [...ids]
}

function artworkById(): Map<string, { poster: string; backdrop: string }> {
  const text = readFileSync(join(process.cwd(), ARTWORK_FILE), 'utf8')
  const artwork = new Map<string, { poster: string; backdrop: string }>()

  for (const match of text.matchAll(ARTWORK_UPDATE)) {
    const poster = match[1]
    const backdrop = match[2]
    const id = match[3]
    if (poster && backdrop && id) {
      artwork.set(id, { poster, backdrop })
    }
  }

  return artwork
}

describe('catalog TMDB artwork seed', () => {
  it('stores a TMDB poster and backdrop path for every curated title', () => {
    const ids = catalogTitleIds()
    const artwork = artworkById()

    expect(ids.length).toBeGreaterThan(0)
    expect(artwork.size).toBe(ids.length)

    for (const id of ids) {
      const paths = artwork.get(id)

      if (!paths) {
        throw new Error(`missing artwork for ${id}`)
      }

      expect(tmdbImageUrl(paths.poster)).toMatch(
        /^https:\/\/image\.tmdb\.org\/t\/p\/w342\//,
      )
      expect(tmdbImageUrl(paths.backdrop, 'w780')).toMatch(
        /^https:\/\/image\.tmdb\.org\/t\/p\/w780\//,
      )
    }
  })
})
