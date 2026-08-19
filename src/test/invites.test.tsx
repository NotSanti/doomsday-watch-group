import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderApp } from '@/test/render-app'
import {
  makeGroup,
  makeInvite,
  makeProfile,
  makeSession,
  getMockInvites,
  setMockGroups,
  setMockInvites,
  setMockProfile,
  setMockSession,
  supabaseFromMock,
  supabaseRpcMock,
} from '@/test/supabase-mock'

const OWNER_ID = '11111111-1111-4111-8111-111111111111'
const MEMBER_ID = '55555555-5555-4555-8555-555555555555'
const GROUP_A = '22222222-2222-4222-8222-222222222222'
const TOKEN = 'ab'.repeat(32)

function signInAsOwner(): void {
  setMockSession(makeSession())
  setMockProfile(makeProfile())
  setMockGroups([makeGroup({ id: GROUP_A, name: 'Alpha Watch' })])
}

function signInAsMember(): void {
  setMockSession(
    makeSession({
      user: { id: MEMBER_ID, email: 'member@example.test' },
    }),
  )
  setMockProfile(makeProfile({ id: MEMBER_ID, display_name: 'Member B' }))
  setMockGroups([
    makeGroup({
      id: GROUP_A,
      name: 'Alpha Watch',
      owner_id: OWNER_ID,
    }),
  ])
}

describe('invites', () => {
  it('shows a safe invalid state without private group data', async () => {
    renderApp('/invite/abc123')

    expect(
      await screen.findByRole('heading', { name: 'Join a watch group' }),
    ).toBeInTheDocument()
    expect(screen.getByText('This invite is not valid.')).toBeInTheDocument()
    expect(screen.queryByText(/review/i)).not.toBeInTheDocument()
    expect(supabaseRpcMock.preview_invite).toHaveBeenCalledWith({
      p_token: 'abc123',
    })
    expect(
      supabaseFromMock.mock.calls.every(
        ([table]) => table === 'profiles' || table === 'groups',
      ),
    ).toBe(true)
  })

  it('previews a valid invite with only safe fields', async () => {
    setMockInvites([
      makeInvite({
        token: TOKEN,
        group_name: 'Alpha Watch',
        owner_display_name: 'Owner A',
        member_count: 2,
      }),
    ])
    renderApp(`/invite/${TOKEN}`)

    expect(
      await screen.findByRole('heading', { name: 'Join a watch group' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Alpha Watch')).toBeInTheDocument()
    expect(screen.getByText(/Owner A/)).toBeInTheDocument()
    expect(screen.getByText(/2 members/)).toBeInTheDocument()
    expect(screen.queryByText(TOKEN)).not.toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Sign in to join' }),
    ).toHaveAttribute(
      'href',
      `/auth?returnTo=${encodeURIComponent(`/invite/${TOKEN}`)}`,
    )
  })

  it('explains expired, revoked, and exhausted invites', async () => {
    setMockInvites([
      makeInvite({
        token: TOKEN,
        expires_at: new Date(Date.now() - 60_000).toISOString(),
      }),
    ])
    const expired = renderApp(`/invite/${TOKEN}`)
    expect(
      await screen.findByText('This invite has expired.'),
    ).toBeInTheDocument()
    expired.unmount()

    setMockInvites([
      makeInvite({
        token: TOKEN,
        revoked_at: new Date().toISOString(),
      }),
    ])
    const revoked = renderApp(`/invite/${TOKEN}`)
    expect(
      await screen.findByText('This invite was revoked.'),
    ).toBeInTheDocument()
    revoked.unmount()

    setMockInvites([
      makeInvite({
        token: TOKEN,
        max_uses: 1,
        use_count: 1,
      }),
    ])
    renderApp(`/invite/${TOKEN}`)
    expect(
      await screen.findByText('This invite has no remaining uses.'),
    ).toBeInTheDocument()
  })

  it('redeems a valid invite and enters the group', async () => {
    const user = userEvent.setup()
    setMockSession(
      makeSession({
        user: { id: MEMBER_ID, email: 'member@example.test' },
      }),
    )
    setMockProfile(makeProfile({ id: MEMBER_ID, display_name: 'Member B' }))
    setMockGroups([])
    setMockInvites([
      makeInvite({
        token: TOKEN,
        group_id: GROUP_A,
        group_name: 'Alpha Watch',
      }),
    ])
    renderApp(`/invite/${TOKEN}`)

    await user.click(await screen.findByRole('button', { name: 'Join group' }))

    await waitFor(() => {
      expect(supabaseRpcMock.redeem_invite).toHaveBeenCalledWith({
        p_token: TOKEN,
      })
    })
    expect(
      await screen.findByRole('heading', { name: 'Alpha Watch' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Member')).toBeInTheDocument()
  })

  it('is idempotent when the visitor is already a member', async () => {
    const user = userEvent.setup()
    signInAsMember()
    setMockInvites([
      makeInvite({
        token: TOKEN,
        group_id: GROUP_A,
        max_uses: 1,
        use_count: 0,
      }),
    ])
    renderApp(`/invite/${TOKEN}`)

    await user.click(await screen.findByRole('button', { name: 'Join group' }))

    await waitFor(() => {
      expect(supabaseRpcMock.redeem_invite).toHaveBeenCalledWith({
        p_token: TOKEN,
      })
    })
    expect(
      await screen.findByRole('heading', { name: 'Alpha Watch' }),
    ).toBeInTheDocument()
    expect(getMockInvites()[0]?.use_count).toBe(0)
  })

  it('lets an owner create an invite and copy the link again from the list', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    signInAsOwner()
    renderApp(`/groups/${GROUP_A}/settings`)

    expect(
      await screen.findByRole('heading', { name: 'Invites' }),
    ).toBeInTheDocument()
    expect(screen.getByText('No invites yet')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Create invite' }))
    const dialog = await screen.findByRole('dialog')
    await user.selectOptions(within(dialog).getByLabelText('Expires'), 'never')
    await user.type(within(dialog).getByLabelText('Max uses (optional)'), '3')
    await user.click(
      within(dialog).getByRole('button', { name: 'Create invite' }),
    )

    const createdDialog = await screen.findByRole('dialog')
    const linkField = await within(createdDialog).findByRole<HTMLInputElement>(
      'textbox',
      { name: 'Invite link' },
    )
    expect(linkField.value).toMatch(/\/invite\/[a-f0-9]+$/i)
    await user.click(
      within(createdDialog).getByRole('button', { name: 'Copy link' }),
    )
    expect(writeText).toHaveBeenCalledWith(linkField.value)

    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Copy link' }))
    expect(writeText).toHaveBeenLastCalledWith(linkField.value)
    expect(
      screen.queryByText(getMockInvites()[0]?.secret ?? ''),
    ).not.toBeInTheDocument()
  })

  it('lets an owner revoke an active invite', async () => {
    const user = userEvent.setup()
    signInAsOwner()
    setMockInvites([
      makeInvite({
        id: '66666666-6666-4666-8666-666666666666',
        token: TOKEN,
        group_id: GROUP_A,
      }),
    ])
    renderApp(`/groups/${GROUP_A}/settings`)

    expect(await screen.findByText('Active')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument()
    expect(screen.queryByText(TOKEN)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Revoke' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(
      within(dialog).getByRole('button', { name: 'Revoke invite' }),
    )

    await waitFor(() => {
      expect(supabaseRpcMock.revoke_invite).toHaveBeenCalledWith({
        p_invite_id: '66666666-6666-4666-8666-666666666666',
      })
    })
    expect(await screen.findByText('Revoked')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Copy link' }),
    ).not.toBeInTheDocument()
  })

  it('lets an owner recopy an expired invite until it is revoked', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    signInAsOwner()
    setMockInvites([
      makeInvite({
        token: TOKEN,
        group_id: GROUP_A,
        expires_at: '2020-01-01T00:00:00.000Z',
      }),
    ])
    renderApp(`/groups/${GROUP_A}/settings`)

    expect(await screen.findByText('Expired')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Revoke' }),
    ).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Copy link' }))
    expect(writeText).toHaveBeenCalledWith(
      `http://127.0.0.1:5173/invite/${TOKEN}`,
    )
  })

  it('hides copy for legacy invites that have no stored token', async () => {
    signInAsOwner()
    setMockInvites([
      makeInvite({
        token: null,
        secret: TOKEN,
        group_id: GROUP_A,
      }),
    ])
    renderApp(`/groups/${GROUP_A}/settings`)

    expect(await screen.findByText('Active')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Copy link' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Revoke' })).toBeInTheDocument()
  })

  it('hides invite management from non-owners', async () => {
    signInAsMember()
    setMockInvites([makeInvite({ token: TOKEN, group_id: GROUP_A })])
    renderApp(`/groups/${GROUP_A}/settings`)

    expect(
      await screen.findByRole('heading', { name: 'Owner-only controls' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Create invite' }),
    ).not.toBeInTheDocument()
    expect(supabaseRpcMock.create_invite).not.toHaveBeenCalled()
    expect(
      supabaseFromMock.mock.calls.every(([table]) => table !== 'group_invites'),
    ).toBe(true)
  })
})
