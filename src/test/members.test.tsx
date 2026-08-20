import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '@/test/render-app'
import {
  makeGroup,
  makeMember,
  makeProfile,
  makeSession,
  makeTitle,
  makeTitleProgress,
  setMockGroups,
  setMockMembers,
  setMockProfile,
  setMockProgress,
  setMockSession,
  setMockTitles,
} from '@/test/supabase-mock'

const OWNER_ID = '11111111-1111-4111-8111-111111111111'
const MEMBER_ID = '55555555-5555-4555-8555-555555555555'
const GROUP_A = '22222222-2222-4222-8222-222222222222'
const IRON_ID = 'aa000000-0000-4000-8000-000000000001'
const WANDA_ID = 'aa000000-0000-4000-8000-000000000020'

function seedGroup(): void {
  setMockSession(makeSession())
  setMockProfile(makeProfile())
  setMockGroups([
    makeGroup({
      id: GROUP_A,
      name: 'Alpha Watch',
      current_title_id: IRON_ID,
    }),
  ])
  setMockMembers([
    makeMember({
      group_id: GROUP_A,
      user_id: OWNER_ID,
      role: 'owner',
      display_name: 'Owner A',
      joined_at: '2026-01-01T00:00:00.000Z',
    }),
    makeMember({
      group_id: GROUP_A,
      user_id: MEMBER_ID,
      role: 'member',
      display_name: 'Member B',
      joined_at: '2026-02-01T00:00:00.000Z',
    }),
  ])
  setMockTitles([
    makeTitle({
      id: IRON_ID,
      name: 'Iron Man',
      doomsday_order: 1,
    }),
    makeTitle({
      id: WANDA_ID,
      name: 'WandaVision',
      doomsday_order: 2,
      release_order: 23,
    }),
  ])
  setMockProgress([
    makeTitleProgress({
      user_id: MEMBER_ID,
      title_id: IRON_ID,
      status: 'watched',
      watched_at: '2026-04-01T04:00:00.000Z',
    }),
  ])
}

describe('members', () => {
  it('lists members with owner badges, sort, and a comparison grid', async () => {
    const user = userEvent.setup()
    seedGroup()
    renderApp(`/groups/${GROUP_A}/members`)

    expect(await screen.findByRole('heading', { name: 'Members' })).toBeInTheDocument()
    expect(screen.getByText('Owner')).toBeInTheDocument()
    const memberCards = screen.getAllByText('Member B')
    expect(memberCards.length).toBeGreaterThan(0)

    const grid = screen.getByRole('table')
    expect(within(grid).getByText('Iron Man')).toBeInTheDocument()
    expect(within(grid).getByText('WandaVision')).toBeInTheDocument()
    expect(within(grid).getAllByText('Watched').length).toBeGreaterThan(0)

    await user.selectOptions(screen.getByLabelText('Sort by'), 'name')
    expect(screen.getByLabelText('Sort by')).toHaveValue('name')
  })

  it('shows yearly watch activity in the progress section', async () => {
    const user = userEvent.setup()
    seedGroup()
    renderApp(`/groups/${GROUP_A}/members`)

    expect(
      await screen.findByRole('heading', { name: 'Progress' }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('gridcell', { name: /1 WATCH ON APRIL 1ST/i }),
    ).toBeInTheDocument()

    const watchedSquare = screen.getByRole('gridcell', {
      name: /1 WATCH ON APRIL 1ST/i,
    })
    await user.hover(watchedSquare)

    expect(
      await screen.findByRole('tooltip', {
        name: /1 WATCH ON APRIL 1ST/i,
      }),
    ).toBeInTheDocument()
  })

  it('shows a friendly error when members cannot load', async () => {
    seedGroup()
    setMockMembers([], { message: 'relation group_members exploded' })
    renderApp(`/groups/${GROUP_A}/members`)

    expect(
      await screen.findByText('Members could not be loaded. Please try again.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('relation group_members exploded'),
    ).not.toBeInTheDocument()
  })
})
