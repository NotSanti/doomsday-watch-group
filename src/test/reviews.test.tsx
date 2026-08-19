import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@/test/render-app'
import {
  getMockReviews,
  makeGroup,
  makeMember,
  makeProfile,
  makeReview,
  makeSession,
  makeTitle,
  setMockGroups,
  setMockMembers,
  setMockProfile,
  setMockReviews,
  setMockSession,
  setMockTitles,
} from '@/test/supabase-mock'

const OWNER_ID = '11111111-1111-4111-8111-111111111111'
const MEMBER_ID = '55555555-5555-4555-8555-555555555555'
const GROUP_A = '22222222-2222-4222-8222-222222222222'
const IRON_ID = 'aa000000-0000-4000-8000-000000000001'

function groupAverageLabel(): string {
  return screen.getByText(/group average/).parentElement?.textContent ?? ''
}

function seedGroup(): void {
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
  setMockTitles([
    makeTitle({
      id: IRON_ID,
      name: 'Iron Man',
      doomsday_order: 1,
      release_order: 1,
    }),
  ])
}

describe('reviews', () => {
  it('creates, updates, and deletes a review and refreshes the average', async () => {
    const user = userEvent.setup()
    seedGroup()
    setMockReviews([
      makeReview({
        id: '88888888-8888-4888-8888-888888888888',
        group_id: GROUP_A,
        user_id: MEMBER_ID,
        title_id: IRON_ID,
        rating: 10,
        body: 'Loved it.',
        contains_spoilers: false,
      }),
    ])
    renderApp(`/groups/${GROUP_A}/titles/${IRON_ID}`)

    expect(
      await screen.findByRole('heading', { name: 'Ratings and reviews' }),
    ).toBeInTheDocument()
    expect(groupAverageLabel()).toMatch(/^10/)
    expect(groupAverageLabel()).toMatch(/1 rating/)
    expect(screen.getByText('Loved it.')).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'No other reviews' }),
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: /^8$/ }))
    await user.type(screen.getByLabelText('Review (optional)'), 'A strong start.')
    await user.click(screen.getByRole('button', { name: 'Save review' }))

    await waitFor(() => {
      expect(getMockReviews()).toHaveLength(2)
      expect(
        screen.getByRole('button', { name: 'Update review' }),
      ).toBeInTheDocument()
      expect(groupAverageLabel()).toMatch(/2 ratings/)
    })
      expect(groupAverageLabel()).toMatch(/^9/)

    const updateButton = screen.getByRole('button', { name: 'Update review' })
    expect(updateButton).toBeDisabled()

    await user.click(screen.getByRole('radio', { name: /^6$/ }))
    expect(updateButton).toBeEnabled()
    await user.click(updateButton)

    await waitFor(() => {
      expect(
        getMockReviews().find((review) => review.user_id === OWNER_ID)?.rating,
      ).toBe(6)
      expect(groupAverageLabel()).toMatch(/^8/)
    })
    expect(groupAverageLabel()).toMatch(/2 ratings/)

    await user.click(screen.getByRole('button', { name: 'Delete review' }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Delete review' }))

    await waitFor(() => {
      expect(getMockReviews()).toHaveLength(1)
      expect(screen.getByRole('button', { name: 'Save review' })).toBeInTheDocument()
    })
    expect(groupAverageLabel()).toMatch(/^10/)
    expect(groupAverageLabel()).toMatch(/1 rating/)
  })

  it('requires a 0.5-step rating before save', async () => {
    const user = userEvent.setup()
    seedGroup()
    renderApp(`/groups/${GROUP_A}/titles/${IRON_ID}`)

    await screen.findByRole('heading', { name: 'Ratings and reviews' })
    await user.click(screen.getByRole('button', { name: 'Save review' }))

    expect(
      await screen.findByText('Choose a rating from 1 to 10.'),
    ).toBeInTheDocument()
    expect(getMockReviews()).toHaveLength(0)
  })

  it('previews half-star hover and keeps update disabled until a change', async () => {
    const user = userEvent.setup()
    seedGroup()
    setMockReviews([
      makeReview({
        group_id: GROUP_A,
        user_id: OWNER_ID,
        title_id: IRON_ID,
        rating: 8,
        body: 'Solid.',
      }),
    ])
    renderApp(`/groups/${GROUP_A}/titles/${IRON_ID}`)

    expect(
      await screen.findByRole('heading', { name: 'Ratings and reviews' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Update review' })).toBeDisabled()
    expect(screen.getByTestId('rating-star-8')).toHaveAttribute('data-fill', '1')
    expect(screen.getByTestId('rating-star-9')).toHaveAttribute('data-fill', '0')

    await user.hover(screen.getByRole('radio', { name: /^9\.5$/ }))

    expect(screen.getByTestId('rating-star-9')).toHaveAttribute('data-fill', '1')
    expect(screen.getByTestId('rating-star-10')).toHaveAttribute('data-fill', '0.5')
    expect(screen.getByText('9.5 / 10')).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: /^9\.5$/ }))

    expect(screen.getByRole('radio', { name: /^9\.5$/ })).toBeChecked()
    expect(screen.getByRole('button', { name: 'Update review' })).toBeEnabled()
  })

  it('hides spoiler text until it is revealed', async () => {
    const user = userEvent.setup()
    seedGroup()
    setMockReviews([
      makeReview({
        id: '88888888-8888-4888-8888-888888888888',
        group_id: GROUP_A,
        user_id: MEMBER_ID,
        title_id: IRON_ID,
        rating: 7.5,
        body: 'Nick Fury is a skrull.',
        contains_spoilers: true,
      }),
    ])
    renderApp(`/groups/${GROUP_A}/titles/${IRON_ID}`)

    expect(
      await screen.findByRole('heading', { name: 'Ratings and reviews' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Member B')).toBeInTheDocument()
    expect(screen.getByText('This review contains spoilers.')).toBeInTheDocument()
    expect(screen.queryByText('Nick Fury is a skrull.')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reveal review' }))

    expect(screen.getByText('Nick Fury is a skrull.')).toBeInTheDocument()
  })

  it('shows empty, loading, and error states for reviews', async () => {
    seedGroup()
    renderApp(`/groups/${GROUP_A}/titles/${IRON_ID}`)

    expect(
      await screen.findByRole('heading', { name: 'Ratings and reviews' }),
    ).toBeInTheDocument()
    expect(screen.getByText('No ratings yet.')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'No other reviews' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Has not rated yet: Owner A, Member B/)).toBeInTheDocument()
  })

  it('shows a friendly error when reviews cannot load', async () => {
    seedGroup()
    setMockReviews([], { message: 'permission denied for table reviews' })
    renderApp(`/groups/${GROUP_A}/titles/${IRON_ID}`)

    expect(
      await screen.findByText('Reviews could not be loaded. Please try again.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('permission denied for table reviews'),
    ).not.toBeInTheDocument()
  })

  it('shows group average ratings on the watchlist', async () => {
    seedGroup()
    setMockReviews([
      makeReview({
        group_id: GROUP_A,
        user_id: OWNER_ID,
        title_id: IRON_ID,
        rating: 8.5,
      }),
    ])
    renderApp(`/groups/${GROUP_A}/watchlist`)

    expect(await screen.findByRole('heading', { name: 'Watchlist' })).toBeInTheDocument()
    expect(screen.getAllByText('Avg 8.5').length).toBeGreaterThan(0)
  })
})
