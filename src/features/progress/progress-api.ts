import { z } from 'zod'
import type { BrowserSupabaseClient } from '@/lib/supabase'
import {
  groupProgressRowSchema,
  type GroupProgressRow,
} from '@/features/progress/progress-schemas'
import type { TitleStatus } from '@/features/watchlist/title-schemas'

const PROGRESS_COLUMNS =
  'group_id, user_id, title_id, status, started_at, watched_at'

export async function listGroupProgress(
  client: BrowserSupabaseClient,
  groupId: string,
): Promise<GroupProgressRow[]> {
  const { data, error } = await client
    .from('member_title_progress')
    .select(PROGRESS_COLUMNS)
    .eq('group_id', groupId)

  if (error) {
    throw error
  }

  return z.array(groupProgressRowSchema).parse(data ?? [])
}

export async function setMyTitleStatus(
  client: BrowserSupabaseClient,
  input: {
    groupId: string
    userId: string
    titleId: string
    status: TitleStatus
  },
): Promise<GroupProgressRow | null> {
  if (input.status === 'not_started') {
    const { error } = await client
      .from('member_title_progress')
      .delete()
      .eq('group_id', input.groupId)
      .eq('user_id', input.userId)
      .eq('title_id', input.titleId)

    if (error) {
      throw error
    }

    return null
  }

  const { data, error } = await client
    .from('member_title_progress')
    .upsert(
      {
        group_id: input.groupId,
        user_id: input.userId,
        title_id: input.titleId,
        status: input.status,
      },
      { onConflict: 'group_id,user_id,title_id' },
    )
    .select(PROGRESS_COLUMNS)
    .maybeSingle()

  if (error) {
    throw error
  }

  return groupProgressRowSchema.parse(data)
}
