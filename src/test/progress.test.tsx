import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { progressKeys } from '@/features/progress/progress-keys'
import { renderApp } from '@/test/render-app'
import {
  emitRealtimeChange,
  getMockProgress,
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
  setProgressWriteError,
} from '@/test/supabase-mock'

const OWNER_ID = '11111111-1111-4111-8111-111111111111'
const MEMBER_ID = '55555555-5555-4555-8555-555555555555'
const GROUP_A = '22222222-2222-4222-8222-222222222222'
const IRON_ID = 'aa000000-0000-4000-8000-000000000001'
const WANDA_ID = 'aa000000-0000-4000-8000-000000000020'
const THOR_ID = 'aa000000-0000-4000-8000-000000000003'

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
    }),
    makeMember({
      group_id: GROUP_A,
      user_id: MEMBER_ID,
      role: 'member',
      display_name: 'Member B',
    }),
  ])
  setMockTitles([
    makeTitle({
      id: IRON_ID,
      name: 'Iron Man',
      doomsday_order: 1,
      release_order: 1,
    }),
    makeTitle({
      id: WANDA_ID,
      name: 'WandaVision',
      media_type: 'series',
      episode_count: 9,
      runtime_minutes: null,
      doomsday_order: 2,
      release_order: 2,
    }),
    makeTitle({
      id: THOR_ID,
      name: 'Thor',
      doomsday_order: 3,
      release_order: 3,
    }),
  ])
  setMockProgress([
    makeTitleProgress({
      group_id: GROUP_A,
      user_id: OWNER_ID,
      title_id: IRON_ID,
      status: 'watched',
      started_at: '2026-08-01T00:00:00.000Z',
      watched_at: '2026-08-02T00:00:00.000Z',
    }),
  ])
}

describe('personal progress and current title', () => {
  it('shows current-title hero, metrics, upcoming titles, and member cards', async () => {
    seedGroup()
    renderApp(`/groups/${GROUP_A}`)

    expect(
      await screen.findByRole('heading', { name: 'Now watching' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Iron Man' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Doomsday order 01')).toHaveTextContent('#01')
    expect(screen.getByText('1/2')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Progress' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'COMPLETION' })).toHaveAttribute(
      'aria-valuenow',
      '0',
    )
    expect(screen.getByText('0 of 3')).toBeInTheDocument()
    expect(screen.getByText('17%')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Titles where every active member has status Watched.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Upcoming' })).toBeInTheDocument()
    expect(screen.getAllByText('WandaVision').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Thor').length).toBeGreaterThan(0)
    expect(
      screen.getByRole('heading', { name: 'Member progress' }),
    ).toBeInTheDocument()
    expect(screen.getByText('1 of 3 watched')).toBeInTheDocument()
    expect(screen.getByText('0 of 3 watched')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Change current title' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Time left')).toBeInTheDocument()
    const dailyPace = screen.getByLabelText(/^Daily pace: /)
    expect(dailyPace).toHaveAttribute('aria-label', 'Daily pace: 1')
    expect(dailyPace).not.toHaveClass('border-chip-gold-fg')
    expect(dailyPace).not.toHaveTextContent('/ day')
  })

  it('highlights daily pace in gold when the group is on pace for today', async () => {
    const watchedToday = new Date().toISOString()
    seedGroup()
    setMockGroups([
      makeGroup({
        id: GROUP_A,
        name: 'Alpha Watch',
        current_title_id: IRON_ID,
        target_date: '2099-12-18T05:00:00.000Z',
      }),
    ])
    setMockProgress([
      makeTitleProgress({
        group_id: GROUP_A,
        user_id: OWNER_ID,
        title_id: IRON_ID,
        status: 'watched',
        started_at: watchedToday,
        watched_at: watchedToday,
      }),
      makeTitleProgress({
        group_id: GROUP_A,
        user_id: MEMBER_ID,
        title_id: IRON_ID,
        status: 'watched',
        started_at: watchedToday,
        watched_at: watchedToday,
      }),
    ])
    renderApp(`/groups/${GROUP_A}`)

    const pace = await screen.findByLabelText('Daily pace: 0')
    expect(pace).toHaveClass('border-chip-gold-fg')
    expect(pace).not.toHaveTextContent('/ day')
  })

  it('lets a member update only their own status and records the mock row', async () => {
    const user = userEvent.setup()
    seedGroup()
    renderApp(`/groups/${GROUP_A}/titles/${WANDA_ID}`)

    const status = await screen.findByRole('button', { name: 'Not watched' })
    expect(status).toHaveAttribute('aria-pressed', 'false')
    expect(status).toHaveClass('cursor-pointer')
    expect(screen.queryByText('My status')).not.toBeInTheDocument()
    await user.click(status)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Watched' })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
    })
    expect(
      getMockProgress().some(
        (row) =>
          row.user_id === OWNER_ID &&
          row.title_id === WANDA_ID &&
          row.status === 'watched' &&
          row.watched_at !== null,
      ),
    ).toBe(true)
  })

  it('rolls status back when the update fails', async () => {
    const user = userEvent.setup()
    seedGroup()
    setProgressWriteError({ code: '42501', message: 'not allowed' })
    renderApp(`/groups/${GROUP_A}/titles/${IRON_ID}`)

    const status = await screen.findByRole('button', { name: 'Watched' })
    expect(status).toHaveAttribute('aria-pressed', 'true')
    await user.click(status)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Watched' })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
    })
    expect(
      getMockProgress().find(
        (row) => row.user_id === OWNER_ID && row.title_id === IRON_ID,
      )?.status,
    ).toBe('watched')
  })

  it('lets the owner change the current title', async () => {
    const user = userEvent.setup()
    seedGroup()
    renderApp(`/groups/${GROUP_A}`)

    await user.click(
      await screen.findByRole('button', { name: 'Change current title' }),
    )
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).queryByLabelText('Search')).not.toBeInTheDocument()
    expect(within(dialog).getByRole('option', { name: 'Iron Man' })).toHaveClass(
      'opacity-50',
    )
    expect(
      within(dialog).getByRole('option', { name: 'WandaVision' }),
    ).not.toHaveClass('opacity-50')
    await user.click(within(dialog).getByRole('option', { name: 'WandaVision' }))
    await user.click(
      within(dialog).getByRole('button', { name: 'Save current title' }),
    )

    expect(
      await screen.findByRole('heading', { name: 'WandaVision' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Doomsday order 02')).toHaveTextContent('#02')
  })

  it('lists every active catalog title in release order, including off-path titles', async () => {
    const user = userEvent.setup()
    const gotgId = 'aa000000-0000-4000-8000-000000000026'
    seedGroup()
    setMockTitles([
      makeTitle({
        id: IRON_ID,
        name: 'Iron Man',
        release_order: 1,
        doomsday_order: 10,
      }),
      makeTitle({
        id: gotgId,
        name: 'Guardians of the Galaxy Vol. 3',
        importance: 'optional',
        release_order: 2,
        doomsday_order: null,
      }),
      makeTitle({
        id: WANDA_ID,
        name: 'WandaVision',
        media_type: 'series',
        episode_count: 9,
        runtime_minutes: null,
        release_order: 3,
        doomsday_order: 1,
      }),
      makeTitle({
        id: THOR_ID,
        name: 'Thor',
        release_order: 4,
        doomsday_order: 2,
      }),
    ])
    renderApp(`/groups/${GROUP_A}`)

    await user.click(
      await screen.findByRole('button', { name: 'Change current title' }),
    )
    const dialog = await screen.findByRole('dialog')
    const options = within(dialog).getAllByRole('option')

    expect(options.map((option) => option.getAttribute('aria-label'))).toEqual([
      'Iron Man',
      'Guardians of the Galaxy Vol. 3',
      'WandaVision',
      'Thor',
    ])
  })

  it('hides current-title controls from members', async () => {
    setMockSession(
      makeSession({
        user: { id: MEMBER_ID, email: 'member@example.test' },
      }),
    )
    setMockProfile(makeProfile({ id: MEMBER_ID, display_name: 'Member B' }))
    setMockGroups([
      makeGroup({
        id: GROUP_A,
        owner_id: OWNER_ID,
        current_title_id: IRON_ID,
      }),
    ])
    setMockMembers([
      makeMember({
        user_id: OWNER_ID,
        role: 'owner',
        display_name: 'Owner A',
      }),
      makeMember({
        user_id: MEMBER_ID,
        role: 'member',
        display_name: 'Member B',
      }),
    ])
    setMockTitles([
      makeTitle({
        id: IRON_ID,
        name: 'Iron Man',
        doomsday_order: 1,
      }),
    ])
    renderApp(`/groups/${GROUP_A}`)

    expect(
      await screen.findByRole('heading', { name: 'Now watching' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Change current title' }),
    ).not.toBeInTheDocument()
  })

  it('refreshes group progress when another client writes a change', async () => {
    seedGroup()
    const { queryClient } = renderApp(`/groups/${GROUP_A}`)

    expect(await screen.findByText('1/2')).toBeInTheDocument()

    setMockProgress([
      makeTitleProgress({
        group_id: GROUP_A,
        user_id: OWNER_ID,
        title_id: IRON_ID,
        status: 'watched',
      }),
      makeTitleProgress({
        group_id: GROUP_A,
        user_id: MEMBER_ID,
        title_id: IRON_ID,
        status: 'watched',
      }),
    ])
    emitRealtimeChange('member_title_progress')

    await waitFor(() => {
      expect(screen.getByText('2/2')).toBeInTheDocument()
    })
    expect(
      queryClient.getQueryData(progressKeys.group(GROUP_A)),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          user_id: MEMBER_ID,
          title_id: IRON_ID,
          status: 'watched',
        }),
      ]),
    )
  })

  it('blocks current-title updates for non-owners at the mock API', async () => {
    setMockSession(
      makeSession({
        user: { id: MEMBER_ID, email: 'member@example.test' },
      }),
    )
    setMockProfile(makeProfile({ id: MEMBER_ID, display_name: 'Member B' }))
    setMockGroups([
      makeGroup({
        id: GROUP_A,
        owner_id: OWNER_ID,
        current_title_id: IRON_ID,
      }),
    ])
    setMockMembers([
      makeMember({
        user_id: OWNER_ID,
        role: 'owner',
        display_name: 'Owner A',
      }),
      makeMember({
        user_id: MEMBER_ID,
        role: 'member',
        display_name: 'Member B',
      }),
    ])
    setMockTitles([makeTitle({ id: IRON_ID, name: 'Iron Man' })])
    renderApp(`/groups/${GROUP_A}/settings`)

    expect(
      await screen.findByRole('heading', { name: 'Owner-only controls' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('listbox', { name: 'Current title' })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Change current title' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Save current title' }),
    ).not.toBeInTheDocument()
  })

  it('lets the owner change the current title from settings via the picker dialog', async () => {
    const user = userEvent.setup()
    seedGroup()
    renderApp(`/groups/${GROUP_A}/settings`)

    expect(
      await screen.findByRole('heading', { name: 'Current title' }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: 'Change current title' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Now watching:/i)).toBeInTheDocument()
    expect(screen.queryByRole('listbox', { name: 'Current title' })).not.toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Change current title' }),
    )

    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('option', { name: 'WandaVision' }))
    await user.click(
      within(dialog).getByRole('button', { name: 'Save current title' }),
    )

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    expect(screen.getByText(/Now watching:/i).textContent).toMatch(/WandaVision/)
  })

  it('ranks titles on the dashboard by group average rating', async () => {
    const user = userEvent.setup()
    const capId = 'aa000000-0000-4000-8000-000000000005'
    const hulkId = 'aa000000-0000-4000-8000-000000000004'
    const antId = 'aa000000-0000-4000-8000-00000000000d'
    seedGroup()
    setMockTitles([
      makeTitle({
        id: IRON_ID,
        name: 'Iron Man',
        doomsday_order: 1,
        release_order: 1,
      }),
      makeTitle({
        id: WANDA_ID,
        name: 'WandaVision',
        doomsday_order: 2,
        release_order: 2,
      }),
      makeTitle({
        id: THOR_ID,
        name: 'Thor',
        doomsday_order: 3,
        release_order: 3,
      }),
      makeTitle({ id: capId, name: 'Captain America: The First Avenger' }),
      makeTitle({ id: hulkId, name: 'The Incredible Hulk' }),
      makeTitle({ id: antId, name: 'Ant-Man' }),
    ])
    setMockReviews([
      makeReview({
        id: '77777777-7777-4777-8777-777777777701',
        user_id: OWNER_ID,
        title_id: IRON_ID,
        rating: 8,
      }),
      makeReview({
        id: '77777777-7777-4777-8777-777777777702',
        user_id: MEMBER_ID,
        title_id: IRON_ID,
        rating: 10,
      }),
      makeReview({
        id: '77777777-7777-4777-8777-777777777703',
        user_id: OWNER_ID,
        title_id: WANDA_ID,
        rating: 10,
      }),
      makeReview({
        id: '77777777-7777-4777-8777-777777777704',
        user_id: OWNER_ID,
        title_id: capId,
        rating: 8,
      }),
      makeReview({
        id: '77777777-7777-4777-8777-777777777705',
        user_id: OWNER_ID,
        title_id: hulkId,
        rating: 7,
      }),
      makeReview({
        id: '77777777-7777-4777-8777-777777777706',
        user_id: OWNER_ID,
        title_id: THOR_ID,
        rating: 6,
      }),
      makeReview({
        id: '77777777-7777-4777-8777-777777777707',
        user_id: OWNER_ID,
        title_id: antId,
        rating: 5,
      }),
    ])
    renderApp(`/groups/${GROUP_A}`)

    expect(
      await screen.findByRole('heading', { name: 'Title ranking' }),
    ).toBeInTheDocument()
    const preview = screen.getByRole('list', { name: 'Top rated titles' })
    expect(preview.className).toMatch(/min-w-0/)
    expect(
      within(preview).getByRole('link', {
        name: '1. WandaVision, 10 out of 10',
      }),
    ).toBeInTheDocument()
    expect(
      within(preview).getByRole('link', {
        name: '2. Iron Man, 9 out of 10',
      }),
    ).toBeInTheDocument()
    expect(
      within(preview).getByRole('link', {
        name: '5. Thor, 6 out of 10',
      }),
    ).toBeInTheDocument()
    expect(
      within(preview).queryByRole('link', {
        name: '6. Ant-Man, 5 out of 10',
      }),
    ).not.toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'View all group ranked titles' }),
    )
    const dialog = await screen.findByRole('dialog', { name: 'Title ranking' })
    const fullList = within(dialog).getByRole('list', {
      name: 'All ranked titles',
    })
    expect(
      within(fullList).getByRole('link', {
        name: '6. Ant-Man, 5 out of 10',
      }),
    ).toBeInTheDocument()
  })

  it('shows an empty group ranking when nobody has rated', async () => {
    seedGroup()
    renderApp(`/groups/${GROUP_A}`)

    expect(
      await screen.findByRole('heading', { name: 'Title ranking' }),
    ).toBeInTheDocument()
    expect(screen.getByText('No ratings yet')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'View all group ranked titles' }),
    ).not.toBeInTheDocument()
  })
})
