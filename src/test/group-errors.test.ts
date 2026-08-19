import { describe, expect, it } from 'vitest'
import {
  toFriendlyCreateGroupError,
  toFriendlyDeleteGroupError,
  toFriendlyGroupDetailError,
  toFriendlyGroupListError,
  toFriendlyGroupMembersError,
  toFriendlyLeaveGroupError,
  toFriendlyRemoveMemberError,
  toFriendlyTransferOwnershipError,
} from '@/features/groups/group-errors'

describe('group errors', () => {
  it('maps known create-group codes without exposing backend text', () => {
    expect(
      toFriendlyCreateGroupError({
        code: '42501',
        message: 'Not authenticated',
      }),
    ).toBe('Sign in again to create a group.')
    expect(
      toFriendlyCreateGroupError({
        code: '23514',
        message: 'violates check constraint groups_name_check',
      }),
    ).toBe(
      'Group name must be 3 to 60 characters. Description can be 280 characters or fewer.',
    )
  })

  it('uses generic fallbacks for unknown errors', () => {
    expect(
      toFriendlyCreateGroupError({
        message: 'column groups.secret does not exist',
      }),
    ).toBe('Your group could not be saved. Please try again.')
    expect(toFriendlyGroupListError()).toBe(
      'Your groups could not be loaded. Please try again.',
    )
    expect(toFriendlyGroupDetailError()).toBe(
      'This group could not be loaded. Please try again.',
    )
    expect(toFriendlyGroupMembersError()).toBe(
      'Members could not be loaded. Please try again.',
    )
    expect(
      toFriendlyLeaveGroupError({
        code: '42501',
        message: 'Transfer ownership or delete the group before leaving',
      }),
    ).toBe('Transfer ownership or delete the group before leaving.')
    expect(toFriendlyRemoveMemberError({ code: '42501' })).toBe(
      'Only the group owner can remove members.',
    )
    expect(toFriendlyTransferOwnershipError({ code: '22023' })).toBe(
      'Choose a current member to become the new owner.',
    )
    expect(toFriendlyDeleteGroupError({ code: '42501' })).toBe(
      'Only the group owner can delete this group.',
    )
  })
})
