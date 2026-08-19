import { z } from 'zod'
import type { BrowserSupabaseClient } from '@/lib/supabase'
import { PLACEHOLDER_DISPLAY_NAME } from '@/features/auth/auth-schemas'
import {
  createGroupSchema,
  groupMemberQueryRowSchema,
  groupRowSchema,
  updateGroupSettingsSchema,
  type CreateGroupValues,
  type GroupMember,
  type GroupRow,
  type UpdateGroupSettingsValues,
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

export async function updateGroupCurrentTitle(
  client: BrowserSupabaseClient,
  groupId: string,
  titleId: string | null,
): Promise<GroupRow> {
  const { data, error } = await client
    .from('groups')
    .update({ current_title_id: titleId })
    .eq('id', groupId)
    .select(GROUP_COLUMNS)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error('CURRENT_TITLE_UPDATE_FAILED')
  }

  return groupRowSchema.parse(data)
}

export async function updateGroupSettings(
  client: BrowserSupabaseClient,
  groupId: string,
  values: UpdateGroupSettingsValues,
): Promise<GroupRow> {
  const parsed = updateGroupSettingsSchema.parse(values)
  const { data, error } = await client
    .from('groups')
    .update({
      name: parsed.name,
      description: parsed.description.length > 0 ? parsed.description : null,
    })
    .eq('id', groupId)
    .select(GROUP_COLUMNS)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error('GROUP_SETTINGS_UPDATE_FAILED')
  }

  return groupRowSchema.parse(data)
}

export async function removeGroupMember(
  client: BrowserSupabaseClient,
  groupId: string,
  userId: string,
): Promise<void> {
  const { error } = await client
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)

  if (error) {
    throw error
  }
}

export async function leaveGroup(
  client: BrowserSupabaseClient,
  groupId: string,
): Promise<void> {
  const { error } = await client.rpc('leave_group', { p_group_id: groupId })

  if (error) {
    throw error
  }
}

export async function transferGroupOwnership(
  client: BrowserSupabaseClient,
  groupId: string,
  newOwnerId: string,
): Promise<void> {
  const { error } = await client.rpc('transfer_ownership', {
    p_group_id: groupId,
    p_new_owner_id: newOwnerId,
  })

  if (error) {
    throw error
  }
}

export async function deleteGroup(
  client: BrowserSupabaseClient,
  groupId: string,
): Promise<void> {
  const { error } = await client.from('groups').delete().eq('id', groupId)

  if (error) {
    throw error
  }
}
