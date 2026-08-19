import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { progressKeys } from '@/features/progress/progress-keys'
import { renderApp } from '@/test/render-app'
import {
  emitRealtimeChange,
  getMockProgress,
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
    expect(screen.getByText('1/2 watched')).toBeInTheDocument()
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
  })

  it('lets a member update only their own status and records the mock row', async () => {
    const user = userEvent.setup()
    seedGroup()
    renderApp(`/groups/${GROUP_A}/titles/${WANDA_ID}`)

    const status = await screen.findByLabelText('My status')
    expect(status).toHaveValue('not_started')
    await user.selectOptions(status, 'watching')

    await waitFor(() => {
      expect(screen.getByLabelText('My status')).toHaveValue('watching')
    })
    expect(
      getMockProgress().some(
        (row) =>
          row.user_id === OWNER_ID &&
          row.title_id === WANDA_ID &&
          row.status === 'watching' &&
          row.started_at !== null &&
          row.watched_at === null,
      ),
    ).toBe(true)
  })

  it('rolls status back when the update fails', async () => {
    const user = userEvent.setup()
    seedGroup()
    setProgressWriteError({ code: '42501', message: 'not allowed' })
    renderApp(`/groups/${GROUP_A}/titles/${IRON_ID}`)

    const status = await screen.findByLabelText('My status')
    expect(status).toHaveValue('watched')
    await user.selectOptions(status, 'watching')

    await waitFor(() => {
      expect(screen.getByLabelText('My status')).toHaveValue('watched')
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
    await user.selectOptions(
      within(dialog).getByLabelText('Current title'),
      WANDA_ID,
    )
    await user.click(
      within(dialog).getByRole('button', { name: 'Save current title' }),
    )

    expect(
      await screen.findByRole('heading', { name: 'WandaVision' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/current title · doomsday 02/i),
    ).toBeInTheDocument()
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

    expect(await screen.findByText('1/2 watched')).toBeInTheDocument()

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
      expect(screen.getByText('2/2 watched')).toBeInTheDocument()
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
      await screen.findByRole('heading', { name: 'Owner only' }),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Current title')).not.toBeInTheDocument()
  })
})
