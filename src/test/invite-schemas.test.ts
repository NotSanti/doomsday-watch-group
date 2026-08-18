import { describe, expect, it } from 'vitest'
import {
  createInviteSchema,
  expiryFromPreset,
  inviteStatus,
} from '@/features/invites/invite-schemas'

describe('invite schemas', () => {
  it('allows blank max uses and rejects zero', () => {
    expect(
      createInviteSchema.safeParse({ expiry: '7d', maxUses: '' }).success,
    ).toBe(true)
    expect(
      createInviteSchema.safeParse({ expiry: '24h', maxUses: '3' }).success,
    ).toBe(true)
    expect(
      createInviteSchema.safeParse({ expiry: 'never', maxUses: '0' }).success,
    ).toBe(false)
  })

  it('classifies invite status without exposing a raw token', () => {
    const now = new Date('2026-08-18T12:00:00.000Z')

    expect(
      inviteStatus(
        {
          revoked_at: null,
          expires_at: '2026-08-19T12:00:00.000Z',
          max_uses: 2,
          use_count: 1,
        },
        now,
      ),
    ).toBe('active')
    expect(
      inviteStatus(
        {
          revoked_at: '2026-08-18T11:00:00.000Z',
          expires_at: null,
          max_uses: null,
          use_count: 0,
        },
        now,
      ),
    ).toBe('revoked')
    expect(
      inviteStatus(
        {
          revoked_at: null,
          expires_at: '2026-08-18T11:00:00.000Z',
          max_uses: null,
          use_count: 0,
        },
        now,
      ),
    ).toBe('expired')
    expect(
      inviteStatus(
        {
          revoked_at: null,
          expires_at: null,
          max_uses: 1,
          use_count: 1,
        },
        now,
      ),
    ).toBe('exhausted')
  })

  it('omits an expiry date for never', () => {
    expect(expiryFromPreset('never')).toBeUndefined()
    expect(expiryFromPreset('24h', new Date('2026-08-18T00:00:00.000Z'))).toBe(
      '2026-08-19T00:00:00.000Z',
    )
  })
})
