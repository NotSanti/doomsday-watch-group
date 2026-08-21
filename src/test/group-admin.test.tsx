import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/render-app'
import {
  makeGroup,
  makeMember,
  makeProfile,
  makeSession,
  makeTitle,
  setLeaveGroupError,
  setMockGroups,
  setMockMembers,
  setMockProfile,
  setMockSession,
  setMockTitles,
  supabaseRpcMock,
} from '@/test/supabase-mock'

const OWNER_ID = '11111111-1111-4111-8111-111111111111'
const MEMBER_ID = '55555555-5555-4555-8555-555555555555'
const GROUP_A = '22222222-2222-4222-8222-222222222222'
const IRON_ID = 'aa000000-0000-4000-8000-000000000001'

function seedOwner(): void {
  setMockSession(makeSession())
  setMockProfile(makeProfile())
  setMockGroups([makeGroup({ id: GROUP_A, name: 'Alpha Watch' })])
  setMockMembers([
    makeMember({
      group_id: GROUP_A,
      user_id: OWNER_ID,
      role: 'owner',
      display_name: 'Owner A',
    }),
    makeMember({
      group_id: GROUP_A,
      user_id: MEMBER_ID,
      role: 'member',
      display_name: 'Member B',
    }),
  ])
  setMockTitles([makeTitle({ id: IRON_ID, name: 'Iron Man' })])
}

function seedMember(): void {
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
  setMockMembers([
    makeMember({
      group_id: GROUP_A,
      user_id: OWNER_ID,
      role: 'owner',
      display_name: 'Owner A',
    }),
    makeMember({
      group_id: GROUP_A,
      user_id: MEMBER_ID,
      role: 'member',
      display_name: 'Member B',
    }),
  ])
}

describe('group administration', () => {
  it('lets an owner rename the group', async () => {
    const user = userEvent.setup()
    seedOwner()
    renderApp(`/groups/${GROUP_A}/settings`)

    expect(
      await screen.findByRole('heading', { name: 'Group details' }),
    ).toBeInTheDocument()
    const nameField = screen.getByLabelText('Group name')
    await user.clear(nameField)
    await user.type(nameField, 'Latveria League')
    await user.click(screen.getByRole('button', { name: 'Save details' }))

    await waitFor(() => {
      expect(screen.getByLabelText('Group name')).toHaveValue('Latveria League')
    })
    expect(screen.queryByLabelText('Timezone')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Target date')).not.toBeInTheDocument()
  })

  it('lets an owner remove a member after confirmation', async () => {
    const user = userEvent.setup()
    seedOwner()
    renderApp(`/groups/${GROUP_A}/settings`)

    expect(
      await screen.findByRole('button', { name: 'Remove' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Remove' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(
      within(dialog).getByRole('button', { name: 'Remove member' }),
    )

    await waitFor(() => {
      expect(
        screen.queryByRole('button', { name: 'Remove' }),
      ).not.toBeInTheDocument()
    })
  })

  it('lets an owner transfer ownership to another member', async () => {
    const user = userEvent.setup()
    seedOwner()
    renderApp(`/groups/${GROUP_A}/settings`)

    expect(
      await screen.findByRole('combobox', { name: 'New owner' }),
    ).toHaveTextContent('Member B')
    await user.click(screen.getByRole('button', { name: 'Transfer ownership' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(
      within(dialog).getByRole('button', { name: 'Confirm transfer' }),
    )

    await waitFor(() => {
      expect(supabaseRpcMock.transfer_ownership).toHaveBeenCalledWith({
        p_group_id: GROUP_A,
        p_new_owner_id: MEMBER_ID,
      })
    })
  })

  it('requires typing the group name before deleting it', async () => {
    const user = userEvent.setup()
    seedOwner()
    renderApp(`/groups/${GROUP_A}/settings`)

    await user.click(
      await screen.findByRole('button', { name: 'Delete group' }),
    )
    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByRole('button', { name: 'Delete group' }),
    ).toBeDisabled()
    await user.type(within(dialog).getByLabelText('Group name'), 'Alpha Watch')
    await user.click(
      within(dialog).getByRole('button', { name: 'Delete group' }),
    )

    expect(
      await screen.findByRole('heading', { name: 'Your groups' }),
    ).toBeInTheDocument()
  })

  it('hides leave for owners and lets members leave', async () => {
    seedOwner()
    renderApp(`/groups/${GROUP_A}/settings`)

    expect(
      await screen.findByRole('heading', { name: 'Group details' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Leave group' }),
    ).not.toBeInTheDocument()
  })

  it('lets a member leave the group', async () => {
    const user = userEvent.setup()
    seedMember()
    renderApp(`/groups/${GROUP_A}/settings`)

    await user.click(await screen.findByRole('button', { name: 'Leave group' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(
      within(dialog).getByRole('button', { name: 'Leave group' }),
    )

    await waitFor(() => {
      expect(supabaseRpcMock.leave_group).toHaveBeenCalledWith({
        p_group_id: GROUP_A,
      })
    })
    expect(
      await screen.findByRole('heading', { name: 'Your groups' }),
    ).toBeInTheDocument()
  })

  it('shows a friendly error when leaving is blocked', async () => {
    const user = userEvent.setup()
    seedMember()
    setLeaveGroupError({
      code: '42501',
      message: 'Transfer ownership or delete the group before leaving',
    })
    renderApp(`/groups/${GROUP_A}/settings`)

    await user.click(await screen.findByRole('button', { name: 'Leave group' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(
      within(dialog).getByRole('button', { name: 'Leave group' }),
    )

    expect(
      await screen.findByText(
        'Transfer ownership or delete the group before leaving.',
      ),
    ).toBeInTheDocument()
  })
})
