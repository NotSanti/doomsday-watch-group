import {
  toFriendlyCreateInviteError,
  toFriendlyInvitePreviewReason,
  toFriendlyRedeemInviteError,
  toFriendlyRevokeInviteError,
  toFriendlyDeleteInviteError,
} from '@/features/invites/invite-errors'

describe('invite errors', () => {
  it('maps preview reasons without leaking backend text', () => {
    expect(toFriendlyInvitePreviewReason('invalid')).toBe(
      'This invite is not valid.',
    )
    expect(toFriendlyInvitePreviewReason('expired')).toBe(
      'This invite has expired.',
    )
    expect(toFriendlyInvitePreviewReason('revoked')).toBe(
      'This invite was revoked.',
    )
    expect(toFriendlyInvitePreviewReason('exhausted')).toBe(
      'This invite has no remaining uses.',
    )
  })

  it('maps owner and redeem failures without exposing SQL', () => {
    expect(
      toFriendlyCreateInviteError({
        code: '42501',
        message: 'Only owners can create invites',
      }),
    ).toBe('Only the group owner can create invites.')
    expect(
      toFriendlyRevokeInviteError({
        code: '42501',
        message: 'Only owners can revoke invites',
      }),
    ).toBe('Only the group owner can revoke invites.')
    expect(
      toFriendlyDeleteInviteError({
        code: '42501',
        message: 'Only owners can delete invites',
      }),
    ).toBe('Only the group owner can delete invites.')
    expect(
      toFriendlyDeleteInviteError({
        code: '22023',
        message: 'Only revoked invites can be deleted',
      }),
    ).toBe('Only revoked invites can be deleted.')
    expect(
      toFriendlyRedeemInviteError({
        code: '22023',
        message: 'Invite is expired',
      }),
    ).toBe('This invite has expired.')
    expect(
      toFriendlyRedeemInviteError({
        message: 'column group_invites.token does not exist',
      }),
    ).toBe('You could not join this group. Please try again.')
  })
})
