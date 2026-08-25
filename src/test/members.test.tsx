import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { chooseSelectOption, expectSelectValue } from '@/test/mobile-ui'
import { renderApp } from '@/test/render-app'
import {
  makeGroup,
  makeMember,
  makeProfile,
  makeReview,
  makeSession,
  makeTitle,
  makeTitleProgress,
  setMockGroups,
  setMockMembers,
  setMockProfile,
  setMockProgress,
  setMockReviews,
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

  it('shows each member’s personal ranking and opens that member’s full list', async () => {
    const user = userEvent.setup()
    const capId = 'aa000000-0000-4000-8000-000000000005'
    const hulkId = 'aa000000-0000-4000-8000-000000000004'
    const thorId = 'aa000000-0000-4000-8000-000000000007'
    const antId = 'aa000000-0000-4000-8000-00000000000d'
    seedGroup()
    setMockTitles([
      makeTitle({ id: IRON_ID, name: 'Iron Man', doomsday_order: 1 }),
      makeTitle({ id: WANDA_ID, name: 'WandaVision', doomsday_order: 2 }),
      makeTitle({ id: capId, name: 'Captain America: The First Avenger' }),
      makeTitle({ id: hulkId, name: 'The Incredible Hulk' }),
      makeTitle({ id: thorId, name: 'Thor' }),
      makeTitle({ id: antId, name: 'Ant-Man' }),
    ])
    setMockReviews([
      makeReview({
        id: '77777777-7777-4777-8777-777777777701',
        user_id: OWNER_ID,
        title_id: IRON_ID,
        rating: 10,
      }),
      makeReview({
        id: '77777777-7777-4777-8777-777777777702',
        user_id: OWNER_ID,
        title_id: WANDA_ID,
        rating: 4,
      }),
      makeReview({
        id: '77777777-7777-4777-8777-777777777703',
        user_id: MEMBER_ID,
        title_id: IRON_ID,
        rating: 10,
      }),
      makeReview({
        id: '77777777-7777-4777-8777-777777777704',
        user_id: MEMBER_ID,
        title_id: WANDA_ID,
        rating: 9,
      }),
      makeReview({
        id: '77777777-7777-4777-8777-777777777705',
        user_id: MEMBER_ID,
        title_id: capId,
        rating: 8,
      }),
      makeReview({
        id: '77777777-7777-4777-8777-777777777706',
        user_id: MEMBER_ID,
        title_id: hulkId,
        rating: 7,
      }),
      makeReview({
        id: '77777777-7777-4777-8777-777777777707',
        user_id: MEMBER_ID,
        title_id: thorId,
        rating: 6,
      }),
      makeReview({
        id: '77777777-7777-4777-8777-777777777708',
        user_id: MEMBER_ID,
        title_id: antId,
        rating: 5,
      }),
    ])
    renderApp(`/groups/${GROUP_A}/members`)

    expect(
      await screen.findByRole('heading', { name: 'Title ranking' }),
    ).toBeInTheDocument()

    const ownerList = screen.getByRole('list', {
      name: 'Top rated titles for Owner A',
    })
    expect(ownerList.className).toMatch(/min-w-0/)
    expect(
      within(ownerList).getByRole('link', {
        name: '1. Iron Man, 10 out of 10',
      }),
    ).toHaveClass('min-w-0')
    expect(
      within(ownerList).getByRole('link', {
        name: '1. Iron Man, 10 out of 10',
      }),
    ).toBeInTheDocument()
    expect(
      within(ownerList).getByRole('link', {
        name: '2. WandaVision, 4 out of 10',
      }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', {
        name: 'View all titles ranked by Owner A',
      }),
    ).not.toBeInTheDocument()

    const memberList = screen.getByRole('list', {
      name: 'Top rated titles for Member B',
    })
    expect(
      within(memberList).getByRole('link', {
        name: '1. Iron Man, 10 out of 10',
      }),
    ).toBeInTheDocument()
    expect(
      within(memberList).getByRole('link', {
        name: '5. Thor, 6 out of 10',
      }),
    ).toBeInTheDocument()
    expect(
      within(memberList).queryByRole('link', {
        name: '6. Ant-Man, 5 out of 10',
      }),
    ).not.toBeInTheDocument()

    await user.click(
      screen.getByRole('button', {
        name: 'View all titles ranked by Member B',
      }),
    )
    const dialog = await screen.findByRole('dialog', { name: 'Member B' })
    const fullList = within(dialog).getByRole('list', {
      name: 'All ranked titles for Member B',
    })
    expect(
      within(fullList).getByRole('link', {
        name: '1. Iron Man, 10 out of 10',
      }),
    ).toBeInTheDocument()
    expect(
      within(fullList).getByRole('link', {
        name: '6. Ant-Man, 5 out of 10',
      }),
    ).toBeInTheDocument()
  })

  it('shows an empty ranking for members who have not rated', async () => {
    seedGroup()
    renderApp(`/groups/${GROUP_A}/members`)

    expect(
      await screen.findByRole('heading', { name: 'Title ranking' }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('No ratings yet.').length).toBe(2)
    expect(
      screen.queryByRole('button', { name: /View all titles ranked by/ }),
    ).not.toBeInTheDocument()
    const rankingCards = screen.getAllByTestId('title-ranking-card')
    expect(rankingCards.length).toBeGreaterThan(0)
    for (const card of rankingCards) {
      expect(card.className).toMatch(/min-w-0/)
      expect(card.className).toMatch(/max-w-full/)
    }
  })

  it('shows a friendly error when ranking reviews cannot load', async () => {
    seedGroup()
    setMockReviews([], { message: 'permission denied for table reviews' })
    renderApp(`/groups/${GROUP_A}/members`)

    expect(
      await screen.findByText('Reviews could not be loaded. Please try again.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('permission denied for table reviews'),
    ).not.toBeInTheDocument()
  })
})
