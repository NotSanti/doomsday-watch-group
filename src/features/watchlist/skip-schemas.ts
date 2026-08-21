import { z } from 'zod'

export const groupSkippedTitleSchema = z.object({
  group_id: z.string().uuid(),
  title_id: z.string().uuid(),
  skipped_by: z.string().uuid(),
  skipped_at: z.string(),
})

export type GroupSkippedTitle = z.infer<typeof groupSkippedTitleSchema>

export const GROUP_SKIPPED_TITLE_COLUMNS =
  'group_id, title_id, skipped_by, skipped_at' as const
