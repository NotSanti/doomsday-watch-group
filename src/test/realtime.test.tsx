import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { reviewKeys } from '@/features/reviews/review-keys'
import { REALTIME_INVALIDATION_DEBOUNCE_MS } from '@/lib/realtime'
import { renderApp } from '@/test/render-app'
import {
  clearRealtimeHandlers,
  emitRealtimeChange,
  getActiveRealtimeChannelNames,
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
  supabaseChannelMock,
} from '@/test/supabase-mock'

const OWNER_ID = '11111111-1111-4111-8111-111111111111'
const MEMBER_ID = '55555555-5555-4555-8555-555555555555'
const GROUP_A = '22222222-2222-4222-8222-222222222222'
const GROUP_B = '33333333-3333-4333-8333-333333333333'
const IRON_ID = 'aa000000-0000-4000-8000-000000000001'

function seedGroups(): void {
  setMockSession(makeSession())
  setMockProfile(makeProfile())
  setMockGroups([
    makeGroup({
      id: GROUP_A,
      name: 'Alpha Watch',
      current_title_id: IRON_ID,
    }),
    makeGroup({
      id: GROUP_B,
      name: 'Beta Watch',
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
    makeMember({
      group_id: GROUP_B,
      user_id: OWNER_ID,
      role: 'owner',
      display_name: 'Owner A',
    }),
  ])
  setMockTitles([
    makeTitle({
      id: IRON_ID,
      name: 'Iron Man',
      doomsday_order: 1,
    }),
  ])
  setMockProgress([
    makeTitleProgress({
      group_id: GROUP_A,
      user_id: OWNER_ID,
      title_id: IRON_ID,
      status: 'watched',
    }),
  ])
}

describe('group realtime', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('subscribes once per active group with a group-scoped channel name', async () => {
    seedGroups()
    renderApp(`/groups/${GROUP_A}`)

    expect(
      await screen.findByRole('heading', { name: 'Alpha Watch' }),
    ).toBeInTheDocument()
    expect(getActiveRealtimeChannelNames()).toEqual([`group-live:${GROUP_A}`])
  })

  it('drops the old channel when opening a different group', async () => {
    const user = userEvent.setup()
    seedGroups()
    renderApp(`/groups/${GROUP_A}`)

    expect(
      await screen.findByRole('heading', { name: 'Alpha Watch' }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    await user.click(screen.getByRole('link', { name: 'Groups' }))
    expect(
      await screen.findByRole('heading', { name: 'Your groups' }),
    ).toBeInTheDocument()
    expect(getActiveRealtimeChannelNames()).toEqual([])
    expect(supabaseChannelMock.removeChannel).toHaveBeenCalled()

    const openLinks = screen.getAllByRole('link', { name: 'Open group' })
    await user.click(openLinks[1]!)
    expect(
      await screen.findByRole('heading', { name: 'Beta Watch' }),
    ).toBeInTheDocument()
    expect(getActiveRealtimeChannelNames()).toEqual([`group-live:${GROUP_B}`])
  })

  it('debounces duplicate review events so invalidation runs once', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    seedGroups()
    setMockReviews([
      makeReview({
        id: '88888888-8888-4888-8888-888888888888',
        group_id: GROUP_A,
        user_id: MEMBER_ID,
        title_id: IRON_ID,
        rating: 8,
        body: 'Solid opener.',
      }),
    ])
    const { queryClient } = renderApp(`/groups/${GROUP_A}/titles/${IRON_ID}`)
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    expect(
      await screen.findByRole('heading', { name: 'Ratings and reviews' }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('Solid opener.')).toHaveLength(1)
    invalidateSpy.mockClear()

    emitRealtimeChange('reviews')
    emitRealtimeChange('reviews')
    emitRealtimeChange('reviews')

    expect(invalidateSpy).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(REALTIME_INVALIDATION_DEBOUNCE_MS)

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: reviewKeys.group(GROUP_A),
      })
    })
    expect(
      invalidateSpy.mock.calls.filter(
        ([args]) =>
          args !== undefined &&
          JSON.stringify(args.queryKey) ===
            JSON.stringify(reviewKeys.group(GROUP_A)),
      ),
    ).toHaveLength(1)
    expect(screen.getAllByText('Solid opener.')).toHaveLength(1)
  })

  it('refreshes the members list after a membership event', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    seedGroups()
    renderApp(`/groups/${GROUP_A}/members`)

    expect((await screen.findAllByText('Member B')).length).toBeGreaterThan(0)

    setMockMembers([
      makeMember({
        group_id: GROUP_A,
        user_id: OWNER_ID,
        role: 'owner',
        display_name: 'Owner A',
      }),
    ])
    emitRealtimeChange('group_members')

    await vi.advanceTimersByTimeAsync(REALTIME_INVALIDATION_DEBOUNCE_MS)

    await waitFor(() => {
      expect(screen.queryAllByText('Member B')).toHaveLength(0)
    })
  })

  it('still applies progress mutations when realtime handlers are unavailable', async () => {
    const user = userEvent.setup()
    seedGroups()
    renderApp(`/groups/${GROUP_A}/titles/${IRON_ID}`)

    const status = await screen.findByRole('button', { name: 'Watched' })
    expect(status).toHaveAttribute('aria-pressed', 'true')

    clearRealtimeHandlers()
    await user.click(status)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Not watching' })).toHaveAttribute(
        'aria-pressed',
        'false',
      )
    })
  })
})
