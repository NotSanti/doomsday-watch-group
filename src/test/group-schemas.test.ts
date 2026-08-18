import { describe, expect, it } from 'vitest'
import {
  createGroupSchema,
  groupRoleForUser,
  isGroupId,
} from '@/features/groups/group-schemas'

describe('group schemas', () => {
  it('requires a group name between 3 and 60 characters', () => {
    expect(
      createGroupSchema.safeParse({ name: 'Ab', description: '' }).success,
    ).toBe(false)
    expect(
      createGroupSchema.safeParse({ name: 'A'.repeat(61), description: '' })
        .success,
    ).toBe(false)
    expect(
      createGroupSchema.safeParse({ name: 'Alpha Watch', description: '' })
        .success,
    ).toBe(true)
  })

  it('trims values and caps description at 280 characters', () => {
    const parsed = createGroupSchema.parse({
      name: '  Latveria League  ',
      description: '  Private MCU run  ',
    })

    expect(parsed).toEqual({
      name: 'Latveria League',
      description: 'Private MCU run',
    })
    expect(
      createGroupSchema.safeParse({
        name: 'Alpha Watch',
        description: 'x'.repeat(281),
      }).success,
    ).toBe(false)
  })

  it('accepts only uuid group ids', () => {
    expect(isGroupId('22222222-2222-4222-8222-222222222222')).toBe(true)
    expect(isGroupId('demo')).toBe(false)
  })

  it('treats the creator as owner', () => {
    expect(
      groupRoleForUser(
        { owner_id: '11111111-1111-4111-8111-111111111111' },
        '11111111-1111-4111-8111-111111111111',
      ),
    ).toBe('owner')
    expect(
      groupRoleForUser(
        { owner_id: '11111111-1111-4111-8111-111111111111' },
        '55555555-5555-4555-8555-555555555555',
      ),
    ).toBe('member')
  })
})
