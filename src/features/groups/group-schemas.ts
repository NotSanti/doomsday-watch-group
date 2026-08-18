import { z } from 'zod'

export const groupIdSchema = z.string().uuid()

export const groupRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  owner_id: z.string().uuid(),
  current_title_id: z.string().uuid().nullable(),
  target_date: z.string(),
  timezone: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Use at least 3 characters.')
    .max(60, 'Use 60 characters or fewer.'),
  description: z
    .string()
    .transform((value) => value.trim())
    .pipe(z.string().max(280, 'Use 280 characters or fewer.')),
})

export type GroupRow = z.infer<typeof groupRowSchema>
export type CreateGroupValues = z.infer<typeof createGroupSchema>

export function isGroupId(value: string): boolean {
  return groupIdSchema.safeParse(value).success
}

export function groupRoleForUser(
  group: Pick<GroupRow, 'owner_id'>,
  userId: string,
): 'owner' | 'member' {
  return group.owner_id === userId ? 'owner' : 'member'
}
