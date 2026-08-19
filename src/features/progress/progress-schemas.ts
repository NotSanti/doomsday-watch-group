import { z } from 'zod'
import { titleStatusSchema } from '@/features/watchlist/title-schemas'

export const groupProgressRowSchema = z.object({
  group_id: z.string().uuid(),
  user_id: z.string().uuid(),
  title_id: z.string().uuid(),
  status: titleStatusSchema,
  started_at: z.string().nullable(),
  watched_at: z.string().nullable(),
})

export type GroupProgressRow = z.infer<typeof groupProgressRowSchema>

export const setTitleStatusSchema = z.object({
  titleId: z.string().uuid(),
  status: titleStatusSchema,
})

export type SetTitleStatusValues = z.infer<typeof setTitleStatusSchema>
