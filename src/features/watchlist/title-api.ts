import { z } from 'zod'
import type { BrowserSupabaseClient } from '@/lib/supabase'
import { titleRowSchema, type TitleRow } from '@/features/watchlist/title-schemas'

const TITLE_COLUMNS =
  'id, tmdb_id, media_type, name, release_date, runtime_minutes, episode_count, poster_path, backdrop_path, synopsis, phase, saga, era, importance, release_order, doomsday_order, is_active'

export async function listTitles(
  client: BrowserSupabaseClient,
): Promise<TitleRow[]> {
  const { data, error } = await client
    .from('titles')
    .select(TITLE_COLUMNS)
    .eq('is_active', true)
    .order('doomsday_order', { ascending: true })

  if (error) {
    throw error
  }

  return z.array(titleRowSchema).parse(data ?? [])
}

export async function fetchTitle(
  client: BrowserSupabaseClient,
  titleId: string,
): Promise<TitleRow | null> {
  const { data, error } = await client
    .from('titles')
    .select(TITLE_COLUMNS)
    .eq('id', titleId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  const title = titleRowSchema.parse(data)
  return title.is_active ? title : null
}
