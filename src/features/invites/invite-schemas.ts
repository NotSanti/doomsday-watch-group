import { z } from 'zod'

export const inviteExpiryPresetSchema = z.enum(['24h', '7d', '30d', 'never'])

export const createInviteSchema = z.object({
  expiry: inviteExpiryPresetSchema,
  maxUses: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || /^[1-9]\d*$/.test(value),
      'Use a whole number of 1 or more, or leave blank for unlimited uses.',
    ),
})

export const inviteRowSchema = z.object({
  id: z.string().uuid(),
  group_id: z.string().uuid(),
  created_at: z.string(),
  expires_at: z.string().nullable(),
  max_uses: z.number().int().nullable(),
  use_count: z.number().int().nonnegative(),
  revoked_at: z.string().nullable(),
  token: z.string().min(16).nullable(),
})

export const createdInviteSchema = z.object({
  invite_id: z.string().uuid(),
  token: z.string().min(16),
  expires_at: z.string().nullable(),
  max_uses: z.number().int().nullable(),
})

export const invitePreviewSchema = z.object({
  group_name: z.string().nullable(),
  owner_display_name: z.string().nullable(),
  member_count: z.number().int().nullable(),
  is_valid: z.boolean(),
  invalid_reason: z.string().nullable(),
})

export const redeemInviteSchema = z.object({
  group_id: z.string().uuid(),
  already_member: z.boolean(),
})

export type InviteExpiryPreset = z.infer<typeof inviteExpiryPresetSchema>
export type CreateInviteValues = z.infer<typeof createInviteSchema>
export type InviteRow = z.infer<typeof inviteRowSchema>
export type CreatedInvite = z.infer<typeof createdInviteSchema>
export type InvitePreview = z.infer<typeof invitePreviewSchema>
export type RedeemInviteResult = z.infer<typeof redeemInviteSchema>
export type InviteStatus = 'active' | 'revoked' | 'expired' | 'exhausted'

export function inviteStatus(
  invite: Pick<
    InviteRow,
    'revoked_at' | 'expires_at' | 'max_uses' | 'use_count'
  >,
  now = new Date(),
): InviteStatus {
  if (invite.revoked_at) {
    return 'revoked'
  }

  if (invite.expires_at && new Date(invite.expires_at) <= now) {
    return 'expired'
  }

  if (invite.max_uses !== null && invite.use_count >= invite.max_uses) {
    return 'exhausted'
  }

  return 'active'
}

export function expiryFromPreset(
  preset: InviteExpiryPreset,
  now = new Date(),
): string | undefined {
  const start = now.getTime()

  if (preset === '24h') {
    return new Date(start + 24 * 60 * 60 * 1000).toISOString()
  }

  if (preset === '7d') {
    return new Date(start + 7 * 24 * 60 * 60 * 1000).toISOString()
  }

  if (preset === '30d') {
    return new Date(start + 30 * 24 * 60 * 60 * 1000).toISOString()
  }

  return undefined
}
