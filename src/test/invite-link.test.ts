import { inviteUrl, parseInviteToken } from '@/features/invites/invite-link'

describe('invite links', () => {
  it('builds and parses invite URLs without requiring extra private data', () => {
    const token = 'ab'.repeat(32)
    const url = inviteUrl('https://doomwatchparty.vercel.app', token)

    expect(url).toBe(`https://doomwatchparty.vercel.app/invite/${token}`)
    expect(parseInviteToken(url)).toBe(token)
    expect(parseInviteToken(`  /invite/${token}  `)).toBe(token)
    expect(parseInviteToken(token)).toBe(token)
  })
})
