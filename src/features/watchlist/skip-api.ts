import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { Database } from '@/types/database'
import {
  GROUP_SKIPPED_TITLE_COLUMNS,
  groupSkippedTitleSchema,
  type GroupSkippedTitle,
} from '@/features/watchlist/skip-schemas'

export async function listGroupSkippedTitles(
  client: SupabaseClient<Database>,
  groupId: string,
): Promise<GroupSkippedTitle[]> {
  const { data, error } = await client
    .from('group_skipped_titles')
    .select(GROUP_SKIPPED_TITLE_COLUMNS)
    .eq('group_id', groupId)

  if (error) {
    throw error
  }

  return z.array(groupSkippedTitleSchema).parse(data ?? [])
}

export async function skipGroupTitle(
  client: SupabaseClient<Database>,
  input: { groupId: string; titleId: string; userId: string },
): Promise<GroupSkippedTitle> {
  const { data, error } = await client
    .from('group_skipped_titles')
    .insert({
      group_id: input.groupId,
      title_id: input.titleId,
      skipped_by: input.userId,
    })
    .select(GROUP_SKIPPED_TITLE_COLUMNS)
    .maybeSingle()

  if (error) {
    throw error
  }

  return groupSkippedTitleSchema.parse(data)
}

export async function unskipGroupTitle(
  client: SupabaseClient<Database>,
  input: { groupId: string; titleId: string },
): Promise<void> {
  const { error } = await client
    .from('group_skipped_titles')
    .delete()
    .eq('group_id', input.groupId)
    .eq('title_id', input.titleId)

  if (error) {
    throw error
  }
}
