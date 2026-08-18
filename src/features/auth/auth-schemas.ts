import { z } from 'zod'

export const PLACEHOLDER_DISPLAY_NAME = 'New member'

export const emailSchema = z
  .string()
  .trim()
  .email('Enter a valid email address.')

export const passwordSchema = z.string().min(8, 'Use at least 8 characters.')

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, 'Enter a display name.')
  .max(60, 'Use 60 characters or fewer.')

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.'),
})

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
})

export const resetPasswordSchema = z.object({
  email: emailSchema,
})

export const updatePasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password.'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

export const profileSchema = z.object({
  displayName: displayNameSchema,
})

export const profileRowSchema = z.object({
  id: z.string().uuid(),
  display_name: z.string(),
  avatar_url: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type SignInValues = z.infer<typeof signInSchema>
export type SignUpValues = z.infer<typeof signUpSchema>
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>
export type UpdatePasswordValues = z.infer<typeof updatePasswordSchema>
export type ProfileFormValues = z.infer<typeof profileSchema>
export type ProfileRow = z.infer<typeof profileRowSchema>

export function needsDisplayNameOnboarding(displayName: string): boolean {
  return displayName.trim() === PLACEHOLDER_DISPLAY_NAME
}
