import { z } from 'zod'
import type { BrowserSupabaseClient } from '@/lib/supabase'
import {
  createdInviteSchema,
  createInviteSchema,
  expiryFromPreset,
  invitePreviewSchema,
  inviteRowSchema,
  redeemInviteSchema,
  type CreateInviteValues,
  type CreatedInvite,
  type InvitePreview,
  type InviteRow,
  type RedeemInviteResult,
} from '@/features/invites/invite-schemas'

const INVITE_COLUMNS =
  'id, group_id, created_at, expires_at, max_uses, use_count, revoked_at'

function firstRpcRow<T>(data: T[] | T | null | undefined): T | null {
  if (data == null) {
    return null
  }

  return Array.isArray(data) ? (data[0] ?? null) : data
}

export async function listInvites(
  client: BrowserSupabaseClient,
  groupId: string,
): Promise<InviteRow[]> {
  const { data, error } = await client
    .from('group_invites')
    .select(INVITE_COLUMNS)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return z.array(inviteRowSchema).parse(data ?? [])
}

export async function createInvite(
  client: BrowserSupabaseClient,
  groupId: string,
  values: CreateInviteValues,
): Promise<CreatedInvite> {
  const parsed = createInviteSchema.parse(values)
  const expiresAt = expiryFromPreset(parsed.expiry)
  const maxUses =
    parsed.maxUses === '' ? undefined : Number.parseInt(parsed.maxUses, 10)

  const { data, error } = await client.rpc('create_invite', {
    p_group_id: groupId,
    ...(expiresAt ? { p_expires_at: expiresAt } : {}),
    ...(maxUses ? { p_max_uses: maxUses } : {}),
  })

  const row = firstRpcRow(data)

  if (error || !row) {
    throw error ?? new Error('CREATE_INVITE_FAILED')
  }

  return createdInviteSchema.parse({
    ...row,
    expires_at: row.expires_at ?? null,
    max_uses: row.max_uses ?? null,
  })
}

export async function previewInvite(
  client: BrowserSupabaseClient,
  token: string,
): Promise<InvitePreview> {
  const { data, error } = await client.rpc('preview_invite', {
    p_token: token,
  })

  const row = firstRpcRow(data)

  if (error || !row) {
    throw error ?? new Error('PREVIEW_INVITE_FAILED')
  }

  return invitePreviewSchema.parse({
    ...row,
    group_name: row.group_name ?? null,
    owner_display_name: row.owner_display_name ?? null,
    member_count: row.member_count ?? null,
    invalid_reason: row.invalid_reason ?? null,
  })
}

export async function redeemInvite(
  client: BrowserSupabaseClient,
  token: string,
): Promise<RedeemInviteResult> {
  const { data, error } = await client.rpc('redeem_invite', {
    p_token: token,
  })

  const row = firstRpcRow(data)

  if (error || !row) {
    throw error ?? new Error('REDEEM_INVITE_FAILED')
  }

  return redeemInviteSchema.parse(row)
}

export async function revokeInvite(
  client: BrowserSupabaseClient,
  inviteId: string,
): Promise<void> {
  const { error } = await client.rpc('revoke_invite', {
    p_invite_id: inviteId,
  })

  if (error) {
    throw error
  }
}
