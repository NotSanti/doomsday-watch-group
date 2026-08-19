import { z } from 'zod'
import type { BrowserSupabaseClient } from '@/lib/supabase'
import {
  activityQueryRowSchema,
  toActivityEvent,
  type ActivityEvent,
} from '@/features/activity/activity-schemas'

const ACTIVITY_COLUMNS =
  'id, group_id, actor_id, event_type, title_id, metadata, created_at, profiles(display_name), titles(name)'

export async function listGroupActivity(
  client: BrowserSupabaseClient,
  groupId: string,
): Promise<ActivityEvent[]> {
  const { data, error } = await client
    .from('activity_events')
    .select(ACTIVITY_COLUMNS)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(40)

  if (error) {
    throw error
  }

  return z
    .array(activityQueryRowSchema)
    .parse(data ?? [])
    .map(toActivityEvent)
}
