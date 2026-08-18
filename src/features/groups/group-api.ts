import { z } from 'zod'
import type { BrowserSupabaseClient } from '@/lib/supabase'
import {
  createGroupSchema,
  groupRowSchema,
  type CreateGroupValues,
  type GroupRow,
} from '@/features/groups/group-schemas'

const GROUP_COLUMNS =
  'id, name, description, owner_id, current_title_id, target_date, timezone, created_at, updated_at'

export async function listGroups(
  client: BrowserSupabaseClient,
): Promise<GroupRow[]> {
  const { data, error } = await client
    .from('groups')
    .select(GROUP_COLUMNS)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return z.array(groupRowSchema).parse(data ?? [])
}

export async function fetchGroup(
  client: BrowserSupabaseClient,
  groupId: string,
): Promise<GroupRow | null> {
  const { data, error } = await client
    .from('groups')
    .select(GROUP_COLUMNS)
    .eq('id', groupId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  return groupRowSchema.parse(data)
}

export async function createGroup(
  client: BrowserSupabaseClient,
  values: CreateGroupValues,
): Promise<GroupRow> {
  const parsed = createGroupSchema.parse(values)
  const { data, error } = await client.rpc('create_group', {
    p_name: parsed.name,
    ...(parsed.description ? { p_description: parsed.description } : {}),
  })

  if (error || !data) {
    throw error ?? new Error('CREATE_GROUP_FAILED')
  }

  return groupRowSchema.parse(data)
}
