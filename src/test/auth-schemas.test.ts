import { existsSync } from 'node:fs'
import {
  needsDisplayNameOnboarding,
  signUpSchema,
} from '@/features/auth/auth-schemas'
import {
  isMissingProfileIcon,
  parseAvatarIconId,
  PROFILE_ICON_IDS,
  profileIconSrc,
  toAvatarUrl,
} from '@/features/auth/profile-icons'

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

  it('stores profile icons as prefixed avatar urls', () => {
    expect(toAvatarUrl('iron-man')).toBe('icon:iron-man')
    expect(parseAvatarIconId('icon:spider-man')).toBe('spider-man')
    expect(parseAvatarIconId('https://cdn.example/photo.png')).toBeNull()
    expect(isMissingProfileIcon(null)).toBe(true)
    expect(isMissingProfileIcon('icon:iron-man')).toBe(false)
  })

  it('maps every profile icon id to a public svg', () => {
    for (const id of PROFILE_ICON_IDS) {
      expect(profileIconSrc(id)).toBe(`/profile-icons/${id}.svg`)
      expect(existsSync(`public/profile-icons/${id}.svg`)).toBe(true)
    }
  })
})
