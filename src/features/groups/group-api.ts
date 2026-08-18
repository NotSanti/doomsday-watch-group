import { z } from 'zod'
import type { BrowserSupabaseClient } from '@/lib/supabase'
import { PLACEHOLDER_DISPLAY_NAME } from '@/features/auth/auth-schemas'
import {
  createGroupSchema,
  groupMemberQueryRowSchema,
  groupRowSchema,
  type CreateGroupValues,
  type GroupMember,
  type GroupRow,
} from '@/features/groups/group-schemas'

const GROUP_COLUMNS =
  'id, name, description, owner_id, current_title_id, target_date, timezone, created_at, updated_at'

const MEMBER_COLUMNS =
  'group_id, user_id, role, joined_at, profiles(display_name)'

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

export async function listGroupMembers(
  client: BrowserSupabaseClient,
  groupIds: string[],
): Promise<GroupMember[]> {
  if (groupIds.length === 0) {
    return []
  }

  const { data, error } = await client
    .from('group_members')
    .select(MEMBER_COLUMNS)
    .in('group_id', groupIds)

  if (error) {
    throw error
  }

  return z
    .array(groupMemberQueryRowSchema)
    .parse(data ?? [])
    .map(toGroupMember)
    .sort(compareGroupMembers)
}

function toGroupMember(
  row: z.infer<typeof groupMemberQueryRowSchema>,
): GroupMember {
  const displayName = row.profiles?.display_name.trim()

  return {
    group_id: row.group_id,
    user_id: row.user_id,
    role: row.role,
    joined_at: row.joined_at,
    display_name:
      displayName && displayName.length > 0
        ? displayName
        : PLACEHOLDER_DISPLAY_NAME,
  }
}

function compareGroupMembers(left: GroupMember, right: GroupMember): number {
  if (left.role !== right.role) {
    return left.role === 'owner' ? -1 : 1
  }

  const joined = left.joined_at.localeCompare(right.joined_at)

  if (joined !== 0) {
    return joined
  }

  return left.display_name.localeCompare(right.display_name)
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
