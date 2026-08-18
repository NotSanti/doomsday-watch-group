import { describe, expect, it } from 'vitest'
import {
  needsDisplayNameOnboarding,
  signUpSchema,
} from '@/features/auth/auth-schemas'

describe('auth schemas', () => {
  it('requires a display name between 1 and 60 characters', () => {
    expect(
      signUpSchema.safeParse({
        email: 'a@example.test',
        password: 'password1',
        displayName: '',
      }).success,
    ).toBe(false)

    expect(
      signUpSchema.safeParse({
        email: 'a@example.test',
        password: 'password1',
        displayName: 'A'.repeat(61),
      }).success,
    ).toBe(false)

    expect(
      signUpSchema.safeParse({
        email: 'a@example.test',
        password: 'password1',
        displayName: 'Santi',
      }).success,
    ).toBe(true)
  })

  it('treats the default profile name as onboarding', () => {
    expect(needsDisplayNameOnboarding('New member')).toBe(true)
    expect(needsDisplayNameOnboarding('Santi')).toBe(false)
  })
})
