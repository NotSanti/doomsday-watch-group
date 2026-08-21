import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { chooseSelectOption, expectSelectValue } from '@/test/mobile-ui'
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
    expect(await screen.findByText('Owner')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Add members' }),
    ).toBeInTheDocument()
    const memberCards = screen.getAllByText('Member B')
    expect(memberCards.length).toBeGreaterThan(0)

    const grid = screen.getByRole('table')
    expect(within(grid).getByText('Iron Man')).toBeInTheDocument()
    expect(within(grid).getByText('WandaVision')).toBeInTheDocument()
    expect(within(grid).getAllByText('Watched').length).toBeGreaterThan(0)

    await chooseSelectOption(user, screen, 'Sort by', 'Name')
    expectSelectValue(screen, 'Sort by', 'Name')
  })

  it('lets the owner open the create-invite flow from Add members', async () => {
    const user = userEvent.setup()
    seedGroup()
    renderApp(`/groups/${GROUP_A}/members`)

    await user.click(
      await screen.findByRole('button', { name: 'Add members' }),
    )

    expect(
      await screen.findByRole('dialog', { name: 'Create invite' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Expires' })).toBeInTheDocument()
  })

  it('hides Add members for non-owners', async () => {
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
        current_title_id: IRON_ID,
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
    setMockTitles([
      makeTitle({ id: IRON_ID, name: 'Iron Man', doomsday_order: 1 }),
      makeTitle({ id: WANDA_ID, name: 'WandaVision', doomsday_order: 2 }),
    ])
    setMockProgress([])
    renderApp(`/groups/${GROUP_A}/members`)

    expect(await screen.findByRole('heading', { name: 'Members' })).toBeInTheDocument()
    expect(await screen.findByText('Owner')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Add members' }),
    ).not.toBeInTheDocument()
  })

  it('shows yearly watch activity in the progress section', async () => {
    const user = userEvent.setup()
    seedGroup()
    renderApp(`/groups/${GROUP_A}/members`)

    expect(
      await screen.findByRole('heading', { name: 'Progress' }),
    ).toBeInTheDocument()

    expect(
      await screen.findByRole('gridcell', { name: /1 WATCH ON APRIL 1ST/i }),
    ).toBeInTheDocument()

    const scrollRegions = screen.getAllByTestId('watch-activity-scroll')
    expect(scrollRegions.length).toBeGreaterThan(0)
    for (const scrollRegion of scrollRegions) {
      expect(scrollRegion.className).toMatch(/overflow-x-auto/)
      expect(scrollRegion.className).toMatch(/min-w-0/)
    }

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
