import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { groupKeys } from '@/features/groups/group-keys'
import { renderApp } from '@/test/render-app'
import {
  makeGroup,
  makeMember,
  makeProfile,
  makeSession,
  setCreateGroupError,
  setMockGroups,
  setMockMembers,
  setMockProfile,
  setMockSession,
  supabaseFromMock,
  supabaseRpcMock,
} from '@/test/supabase-mock'

const USER_ID = '11111111-1111-4111-8111-111111111111'
const MEMBER_ID = '55555555-5555-4555-8555-555555555555'
const GROUP_A = '22222222-2222-4222-8222-222222222222'
const GROUP_B = '33333333-3333-4333-8333-333333333333'
const UNKNOWN_GROUP = '44444444-4444-4444-8444-444444444444'

function signInAsOwner(): void {
  setMockSession(makeSession())
  setMockProfile(makeProfile())
}

describe('groups', () => {
  it('shows an empty state when the member has no groups', async () => {
    signInAsOwner()
    renderApp('/app')

    expect(
      await screen.findByRole('heading', { name: 'Your groups' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/create a private watch group/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Create group' }),
    ).toBeInTheDocument()
  })

  it('validates the create-group form before calling the backend', async () => {
    const user = userEvent.setup()
    signInAsOwner()
    renderApp('/app')

    await user.click(
      await screen.findByRole('button', { name: 'Create group' }),
    )
    const dialog = await screen.findByRole('dialog')
    await user.click(
      within(dialog).getByRole('button', { name: 'Create group' }),
    )

    expect(
      await screen.findByText('Use at least 3 characters.'),
    ).toBeInTheDocument()
    expect(supabaseRpcMock.create_group).not.toHaveBeenCalled()
  })

  it('creates a group through the atomic function and enters it as owner', async () => {
    const user = userEvent.setup()
    signInAsOwner()
    renderApp('/app')

    await user.click(
      await screen.findByRole('button', { name: 'Create group' }),
    )
    const dialog = await screen.findByRole('dialog')
    await user.type(
      within(dialog).getByLabelText('Group name'),
      'Latveria League',
    )
    await user.type(
      within(dialog).getByLabelText('Description (optional)'),
      'Private MCU run',
    )
    await user.click(
      within(dialog).getByRole('button', { name: 'Create group' }),
    )

    await waitFor(() => {
      expect(supabaseRpcMock.create_group).toHaveBeenCalledWith({
        p_name: 'Latveria League',
        p_description: 'Private MCU run',
      })
    })
    expect(
      await screen.findByRole('heading', { name: 'Latveria League' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Owner')).toBeInTheDocument()
    expect(screen.getByText('Private MCU run')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Members' })).toBeInTheDocument()
    expect(await screen.findByText('Owner A')).toBeInTheDocument()
    expect(screen.getByText('(owner)')).toBeInTheDocument()
  })

  it('shows a friendly error when group creation fails', async () => {
    const user = userEvent.setup()
    signInAsOwner()
    setCreateGroupError({
      code: '42501',
      message: 'Not authenticated',
    })
    renderApp('/app')

    await user.click(
      await screen.findByRole('button', { name: 'Create group' }),
    )
    const dialog = await screen.findByRole('dialog')
    await user.type(
      within(dialog).getByLabelText('Group name'),
      'Latveria League',
    )
    await user.click(
      within(dialog).getByRole('button', { name: 'Create group' }),
    )

    expect(
      await screen.findByText('Sign in again to create a group.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Not authenticated')).not.toBeInTheDocument()
  })

  it('lists memberships and opens a group dashboard', async () => {
    const user = userEvent.setup()
    signInAsOwner()
    setMockGroups([
      makeGroup({
        id: GROUP_A,
        name: 'Alpha Watch',
        description: 'First room',
      }),
    ])
    renderApp('/app')

    expect(
      await screen.findByRole('heading', { name: 'Your groups' }),
    ).toBeInTheDocument()
    expect(screen.getByText('First room')).toBeInTheDocument()
    expect(screen.getByText('Owner')).toBeInTheDocument()
    expect(await screen.findByText('Owner A')).toBeInTheDocument()
    expect(screen.getByText('(owner)')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Open group' }))

    expect(
      await screen.findByRole('heading', { name: 'Alpha Watch' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Members' })).toBeInTheDocument()
    expect(await screen.findByText('Owner A')).toBeInTheDocument()
  })

  it('lists each group’s members and marks the owner with a crown', async () => {
    const user = userEvent.setup()
    signInAsOwner()
    setMockGroups([
      makeGroup({
        id: GROUP_A,
        name: 'Alpha Watch',
      }),
    ])
    setMockMembers([
      makeMember({
        group_id: GROUP_A,
        user_id: USER_ID,
        role: 'owner',
        display_name: 'Owner A',
      }),
      makeMember({
        group_id: GROUP_A,
        user_id: MEMBER_ID,
        role: 'member',
        display_name: 'Member B',
        joined_at: '2026-08-19T00:00:00.000Z',
      }),
    ])
    renderApp('/app')

    const tileHeading = await screen.findByRole('heading', {
      name: 'Alpha Watch',
    })
    const tile = tileHeading.closest('li')
    expect(tile).not.toBeNull()
    expect(await within(tile!).findByText('Owner A')).toBeInTheDocument()
    expect(within(tile!).getByText('(owner)')).toBeInTheDocument()
    expect(within(tile!).getByText('Member B')).toBeInTheDocument()

    await user.click(within(tile!).getByRole('link', { name: 'Open group' }))

    const membersHeading = await screen.findByRole('heading', {
      name: 'Members',
    })
    const roster = membersHeading.closest('section')
    expect(roster).not.toBeNull()
    expect(await within(roster!).findByText('Owner A')).toBeInTheDocument()
    expect(within(roster!).getByText('(owner)')).toBeInTheDocument()
    expect(within(roster!).getByText('Member B')).toBeInTheDocument()
  })

  it('keeps the group list visible if members cannot load', async () => {
    signInAsOwner()
    setMockGroups([makeGroup({ id: GROUP_A, name: 'Alpha Watch' })])
    setMockMembers([], { message: 'relation group_members exploded' })
    renderApp('/app')

    expect(
      await screen.findByRole('heading', { name: 'Alpha Watch' }),
    ).toBeInTheDocument()
    expect(
      await screen.findByText('Members could not be loaded. Please try again.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('relation group_members exploded'),
    ).not.toBeInTheDocument()
  })

  it('switches between groups without mixing query data', async () => {
    const user = userEvent.setup()
    signInAsOwner()
    setMockGroups([
      makeGroup({ id: GROUP_A, name: 'Alpha Watch' }),
      makeGroup({
        id: GROUP_B,
        name: 'Beta Watch',
        description: 'Second room',
      }),
    ])
    const { queryClient } = renderApp(`/groups/${GROUP_A}`)

    expect(
      await screen.findByRole('heading', { name: 'Alpha Watch' }),
    ).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Switch group'), GROUP_B)

    expect(
      await screen.findByRole('heading', { name: 'Beta Watch' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Second room')).toBeInTheDocument()
    expect(queryClient.getQueryData(groupKeys.detail(GROUP_A))).toMatchObject({
      id: GROUP_A,
      name: 'Alpha Watch',
    })
    expect(queryClient.getQueryData(groupKeys.detail(GROUP_B))).toMatchObject({
      id: GROUP_B,
      name: 'Beta Watch',
    })
    expect(queryClient.getQueryData(groupKeys.list(USER_ID))).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: GROUP_A }),
        expect.objectContaining({ id: GROUP_B }),
      ]),
    )
  })

  it('shows a safe unavailable state for non-members and invalid ids', async () => {
    signInAsOwner()
    setMockGroups([makeGroup({ id: GROUP_A, name: 'Alpha Watch' })])
    renderApp(`/groups/${UNKNOWN_GROUP}/watchlist`)

    expect(
      await screen.findByRole('heading', { name: 'Group not available' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Watchlist' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: 'Dashboard' }),
    ).not.toBeInTheDocument()
    expect(
      supabaseFromMock.mock.calls.every(
        ([table]) => table === 'profiles' || table === 'groups',
      ),
    ).toBe(true)
  })

  it('does not fetch a group row for an invalid group id', async () => {
    signInAsOwner()
    renderApp('/groups/demo')

    expect(
      await screen.findByRole('heading', { name: 'Group not available' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Watchlist' }),
    ).not.toBeInTheDocument()
  })

  it('shows an error state when the group list cannot load', async () => {
    signInAsOwner()
    setMockGroups([], { message: 'relation groups exploded' })
    renderApp('/app')

    expect(
      await screen.findByText(
        'Your groups could not be loaded. Please try again.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('relation groups exploded'),
    ).not.toBeInTheDocument()
  })

  it('shows an error state when a member group cannot load', async () => {
    signInAsOwner()
    setMockGroups([makeGroup({ id: GROUP_A })], {
      message: 'connection reset',
    })
    renderApp(`/groups/${GROUP_A}`)

    expect(
      await screen.findByText(
        'This group could not be loaded. Please try again.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText('connection reset')).not.toBeInTheDocument()
  })
})
