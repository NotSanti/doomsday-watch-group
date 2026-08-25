import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { groupKeys } from '@/features/groups/group-keys'
import {
  GROUPS_LIST_NAV_STATE,
  writeHomeGroupPreference,
} from '@/features/groups/home-group'
import { openMobileNav } from '@/test/mobile-ui'
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
    renderApp('/app', { state: GROUPS_LIST_NAV_STATE })

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
    renderApp('/app', { state: GROUPS_LIST_NAV_STATE })

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
    renderApp('/app', { state: GROUPS_LIST_NAV_STATE })

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
      await screen.findByRole(
        'heading',
        { level: 1, name: 'Latveria League' },
        { timeout: 8_000 },
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Owner')).toBeInTheDocument()
    expect(screen.getByText('Private MCU run')).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: 'Members' }),
    ).toBeInTheDocument()
    const createdRoster = screen
      .getByRole('heading', { name: 'Members' })
      .closest('section')
    expect(createdRoster).not.toBeNull()
    expect(
      await within(createdRoster!).findByText('Owner A'),
    ).toBeInTheDocument()
  })

  it('shows a friendly error when group creation fails', async () => {
    const user = userEvent.setup()
    signInAsOwner()
    setCreateGroupError({
      code: '42501',
      message: 'Not authenticated',
    })
    renderApp('/app', { state: GROUPS_LIST_NAV_STATE })

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
    renderApp('/app', { state: GROUPS_LIST_NAV_STATE })

    expect(
      await screen.findByRole('heading', { name: 'Your groups' }),
    ).toBeInTheDocument()
    expect(screen.getByText('First room')).toBeInTheDocument()
    expect(screen.getByText('Owner')).toBeInTheDocument()
    expect(await screen.findByText('Owner A')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Open group' }))

    expect(
      await screen.findByRole('heading', { name: 'Alpha Watch' }),
    ).toBeInTheDocument()
    const mobileNav = await openMobileNav(user, 'App')
    expect(within(mobileNav).getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Members' })).toBeInTheDocument()
    const dashboardRoster = screen
      .getByRole('heading', { name: 'Members' })
      .closest('section')
    expect(dashboardRoster).not.toBeNull()
    expect(
      await within(dashboardRoster!).findByText('Owner A'),
    ).toBeInTheDocument()
    const membersToggle = within(dashboardRoster!).getByRole('button', {
      name: 'Members',
    })
    expect(membersToggle).toHaveAttribute('aria-expanded', 'true')
    await user.click(membersToggle)
    expect(membersToggle).toHaveAttribute('aria-expanded', 'false')
    expect(within(dashboardRoster!).queryByText('Owner A')).not.toBeInTheDocument()
  })

  it('lists each group’s members as icons and highlights the owner', async () => {
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
        avatar_url: 'icon:iron-man',
      }),
      makeMember({
        group_id: GROUP_A,
        user_id: MEMBER_ID,
        role: 'member',
        display_name: 'Member B',
        avatar_url: 'icon:spider-man',
        joined_at: '2026-08-19T00:00:00.000Z',
      }),
    ])
    renderApp('/app', { state: GROUPS_LIST_NAV_STATE })

    const tileHeading = await screen.findByRole('heading', {
      name: 'Alpha Watch',
    })
    const tile = tileHeading.closest('li')
    expect(tile).not.toBeNull()
    expect(await within(tile!).findByText('Owner A')).toBeInTheDocument()
    expect(within(tile!).getByText('Member B')).toBeInTheDocument()
    const ownerAvatar = within(tile!).getByText('Owner A').previousElementSibling
    const memberAvatar = within(tile!).getByText('Member B').previousElementSibling
    expect(ownerAvatar).toHaveClass('border-gold')
    expect(memberAvatar).toHaveClass('border-border')
    expect(ownerAvatar?.querySelector('img')).toHaveAttribute(
      'src',
      '/profile-icons/iron-man.svg',
    )
    expect(memberAvatar?.querySelector('img')).toHaveAttribute(
      'src',
      '/profile-icons/spider-man.svg',
    )

    await user.click(within(tile!).getByRole('link', { name: 'Open group' }))

    const membersHeading = await screen.findByRole('heading', {
      name: 'Members',
    })
    const roster = membersHeading.closest('section')
    expect(roster).not.toBeNull()
    const dashboardOwner = await within(roster!).findByText('Owner A')
    const dashboardOwnerAvatar = dashboardOwner.previousElementSibling
    expect(dashboardOwnerAvatar).toHaveClass('border-gold')
    expect(within(roster!).getByText('Member B')).toBeInTheDocument()
  })

  it('keeps group tile actions aligned when a group has no notes', async () => {
    signInAsOwner()
    setMockGroups([
      makeGroup({
        id: GROUP_A,
        name: 'Alpha Watch',
        description: 'First room',
      }),
      makeGroup({
        id: GROUP_B,
        name: 'Beta Watch',
        description: null,
      }),
    ])
    renderApp('/app', { state: GROUPS_LIST_NAV_STATE })

    const alpha = (
      await screen.findByRole('heading', { name: 'Alpha Watch' })
    ).closest('li')
    const beta = (
      await screen.findByRole('heading', { name: 'Beta Watch' })
    ).closest('li')
    expect(alpha).not.toBeNull()
    expect(beta).not.toBeNull()

    const alphaNotes = alpha!.querySelector('p.min-h-10')
    const betaNotes = beta!.querySelector('p.min-h-10')
    expect(alphaNotes).toHaveClass('min-h-10', 'line-clamp-2')
    expect(betaNotes).toHaveClass('min-h-10', 'line-clamp-2')
    expect(alphaNotes).toHaveTextContent('First room')
    expect(betaNotes).toHaveTextContent('')
    expect(within(alpha!).getByText('Members')).not.toHaveClass('text-center')
    expect(
      within(alpha!).getByRole('link', { name: 'Open group' }),
    ).toBeInTheDocument()
    expect(
      within(beta!).getByRole('link', { name: 'Open group' }),
    ).toBeInTheDocument()
  })

  it('keeps the group list visible if members cannot load', async () => {
    signInAsOwner()
    setMockGroups([makeGroup({ id: GROUP_A, name: 'Alpha Watch' })])
    setMockMembers([], { message: 'relation group_members exploded' })
    renderApp('/app', { state: GROUPS_LIST_NAV_STATE })

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

  it('opens the lone group dashboard on the first groups-page load', async () => {
    signInAsOwner()
    setMockGroups([makeGroup({ id: GROUP_A, name: 'Alpha Watch' })])
    renderApp('/app')

    expect(
      await screen.findByRole('heading', { name: 'Alpha Watch' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Your groups' }),
    ).not.toBeInTheDocument()
  })

  it('stays on the groups list when Groups is opened from the navbar', async () => {
    const user = userEvent.setup()
    signInAsOwner()
    setMockGroups([makeGroup({ id: GROUP_A, name: 'Alpha Watch' })])
    renderApp('/app')

    expect(
      await screen.findByRole('heading', { name: 'Alpha Watch' }),
    ).toBeInTheDocument()

    const mobileNav = await openMobileNav(user, 'App')
    await user.click(within(mobileNav).getByRole('link', { name: 'Groups' }))

    expect(
      await screen.findByRole('heading', { name: 'Your groups' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Alpha Watch is your home group. Click to disable.',
      }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('opens the selected home group when the member belongs to more than one', async () => {
    signInAsOwner()
    writeHomeGroupPreference(USER_ID, { kind: 'group', id: GROUP_B })
    setMockGroups([
      makeGroup({ id: GROUP_A, name: 'Alpha Watch' }),
      makeGroup({ id: GROUP_B, name: 'Beta Watch' }),
    ])
    renderApp('/app')

    expect(
      await screen.findByRole('heading', { name: 'Beta Watch' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Your groups' }),
    ).not.toBeInTheDocument()
  })

  it('does not auto-open after the member disables the home group', async () => {
    signInAsOwner()
    writeHomeGroupPreference(USER_ID, { kind: 'none' })
    setMockGroups([makeGroup({ id: GROUP_A, name: 'Alpha Watch' })])
    renderApp('/app')

    expect(
      await screen.findByRole('heading', { name: 'Your groups' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Set Alpha Watch as home group' }),
    ).toHaveAttribute('aria-pressed', 'false')
  })

  it('keeps only one home group active at a time', async () => {
    const user = userEvent.setup()
    signInAsOwner()
    setMockGroups([
      makeGroup({ id: GROUP_A, name: 'Alpha Watch' }),
      makeGroup({ id: GROUP_B, name: 'Beta Watch' }),
    ])
    renderApp('/app', { state: GROUPS_LIST_NAV_STATE })

    const alphaHome = await screen.findByRole('button', {
      name: 'Set Alpha Watch as home group',
    })
    const betaHome = screen.getByRole('button', {
      name: 'Set Beta Watch as home group',
    })
    expect(alphaHome).toHaveAttribute('aria-pressed', 'false')
    expect(betaHome).toHaveAttribute('aria-pressed', 'false')

    await user.click(alphaHome)
    expect(
      screen.getByRole('button', {
        name: 'Alpha Watch is your home group. Click to disable.',
      }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getByRole('button', { name: 'Set Beta Watch as home group' }),
    ).toHaveAttribute('aria-pressed', 'false')

    await user.click(
      screen.getByRole('button', { name: 'Set Beta Watch as home group' }),
    )
    expect(
      screen.getByRole('button', {
        name: 'Beta Watch is your home group. Click to disable.',
      }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getByRole('button', { name: 'Set Alpha Watch as home group' }),
    ).toHaveAttribute('aria-pressed', 'false')

    await user.click(
      screen.getByRole('button', {
        name: 'Beta Watch is your home group. Click to disable.',
      }),
    )
    expect(
      screen.getByRole('button', { name: 'Set Beta Watch as home group' }),
    ).toHaveAttribute('aria-pressed', 'false')
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

    await user.click(screen.getByRole('button', { name: 'Switch group' }))
    await user.click(
      await screen.findByRole('menuitem', { name: 'Beta Watch' }),
    )

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
    renderApp('/app', { state: GROUPS_LIST_NAV_STATE })

    expect(
      await screen.findByText(
        'Your groups could not be loaded. Please try again.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('relation groups exploded'),
    ).not.toBeInTheDocument()
  })

  it('keeps group navigation when opening profile from a group', async () => {
    const user = userEvent.setup()
    signInAsOwner()
    setMockGroups([makeGroup({ id: GROUP_A, name: 'Alpha Watch' })])
    setMockMembers([
      makeMember({
        group_id: GROUP_A,
        user_id: USER_ID,
        role: 'owner',
        display_name: 'Owner A',
      }),
    ])
    renderApp(`/groups/${GROUP_A}`)

    expect(
      await screen.findByRole('heading', { name: 'Alpha Watch' }),
    ).toBeInTheDocument()

    const mobileNav = await openMobileNav(user, 'App')
    const profileLink = within(mobileNav).getByRole('link', { name: 'Profile' })
    expect(profileLink).toHaveAttribute('href', `/groups/${GROUP_A}/profile`)
    await user.click(profileLink)

    expect(
      await screen.findByRole('heading', { name: 'Profile' }),
    ).toBeInTheDocument()

    const profileNav = await openMobileNav(user, 'App')
    expect(
      within(profileNav).getByRole('link', { name: 'Dashboard' }),
    ).toBeInTheDocument()
    expect(
      within(profileNav).getByRole('link', { name: 'Watchlist' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Switch group' })).toBeInTheDocument()
    expect(screen.getByText('Alpha Watch')).toBeInTheDocument()
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
