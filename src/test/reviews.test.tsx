import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
      avatar_url: 'icon:iron-man',
    }),
    makeMember({
      group_id: GROUP_A,
      user_id: MEMBER_ID,
      role: 'member',
      display_name: 'Member B',
      avatar_url: 'icon:spider-man',
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
    expect(screen.getByText('Loved it.')).toHaveClass('uppercase')
    expect(
      screen.queryByRole('heading', { name: 'No reviews yet' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Write review' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Review (optional)')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Write review' }))
    const writeDialog = screen.getByRole('dialog', { name: 'Write review' })
    await user.click(within(writeDialog).getByRole('radio', { name: /^8$/ }))
    await user.type(
      within(writeDialog).getByLabelText('Review (optional)'),
      'A strong start.',
    )
    await user.click(within(writeDialog).getByRole('button', { name: 'Save review' }))

    await waitFor(() => {
      expect(getMockReviews()).toHaveLength(2)
      expect(screen.getByText('A strong start.')).toBeInTheDocument()
      expect(groupAverageLabel()).toMatch(/2 ratings/)
    })
    expect(groupAverageLabel()).toMatch(/^9/)
    expect(screen.queryByRole('button', { name: 'Write review' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('8 out of 10')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Edit review' }))
    const editDialog = screen.getByRole('dialog', { name: 'Edit review' })
    const updateButton = within(editDialog).getByRole('button', {
      name: 'Update review',
    })
    expect(updateButton).toBeDisabled()

    await user.click(within(editDialog).getByRole('radio', { name: /^6$/ }))
    expect(updateButton).toBeEnabled()
    await user.click(updateButton)

    await waitFor(() => {
      expect(
        getMockReviews().find((review) => review.user_id === OWNER_ID)?.rating,
      ).toBe(6)
      expect(groupAverageLabel()).toMatch(/^8/)
    })
    expect(groupAverageLabel()).toMatch(/2 ratings/)
    expect(screen.getByLabelText('6 out of 10')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete review' }))
    const dialog = screen.getByRole('dialog', { name: 'Delete review' })
    await user.click(within(dialog).getByRole('button', { name: 'Delete review' }))

    await waitFor(() => {
      expect(getMockReviews()).toHaveLength(1)
      expect(screen.getByRole('button', { name: 'Write review' })).toBeInTheDocument()
    })
    expect(groupAverageLabel()).toMatch(/^10/)
    expect(groupAverageLabel()).toMatch(/1 rating/)
  })

  it('requires a 0.5-step rating before save', async () => {
    const user = userEvent.setup()
    seedGroup()
    renderApp(`/groups/${GROUP_A}/titles/${IRON_ID}`)

    await screen.findByRole('heading', { name: 'Ratings and reviews' })
    await user.click(screen.getByRole('button', { name: 'Write review' }))
    await user.click(
      within(screen.getByRole('dialog', { name: 'Write review' })).getByRole(
        'button',
        { name: 'Save review' },
      ),
    )

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
    expect(screen.getByLabelText('8 out of 10')).toBeInTheDocument()
    expect(screen.queryByTestId('review-star-9')).not.toBeInTheDocument()
    expect(screen.getByTestId('review-star-8')).toHaveAttribute('data-fill', '1')

    await user.click(screen.getByRole('button', { name: 'Edit review' }))
    const editDialog = screen.getByRole('dialog', { name: 'Edit review' })
    expect(
      within(editDialog).getByRole('button', { name: 'Update review' }),
    ).toBeDisabled()
    expect(within(editDialog).getByRole('radio', { name: /^8$/ })).toBeChecked()
    expect(within(editDialog).getByTestId('rating-star-8')).toHaveAttribute(
      'data-fill',
      '1',
    )
    expect(within(editDialog).getByTestId('rating-star-9')).toHaveAttribute(
      'data-fill',
      '0',
    )

    await user.hover(within(editDialog).getByRole('radio', { name: /^9\.5$/ }))

    expect(within(editDialog).getByTestId('rating-star-9')).toHaveAttribute(
      'data-fill',
      '1',
    )
    expect(within(editDialog).getByTestId('rating-star-10')).toHaveAttribute(
      'data-fill',
      '0.5',
    )
    expect(within(editDialog).getByText('9.5 / 10')).toBeInTheDocument()

    await user.click(within(editDialog).getByRole('radio', { name: /^9\.5$/ }))

    expect(within(editDialog).getByRole('radio', { name: /^9\.5$/ })).toBeChecked()
    expect(
      within(editDialog).getByRole('button', { name: 'Update review' }),
    ).toBeEnabled()
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
    expect(screen.getByText('Member B')).toHaveClass('uppercase')
    expect(screen.getByLabelText('7.5 out of 10')).toBeInTheDocument()
    expect(screen.getByTestId('review-star-8')).toHaveAttribute('data-fill', '0.5')
    expect(screen.queryByTestId('review-star-9')).not.toBeInTheDocument()
    expect(screen.queryByText('7.5 / 10')).not.toBeInTheDocument()
    expect(screen.getByText('This review contains spoilers.')).toBeInTheDocument()
    expect(screen.queryByText('Nick Fury is a skrull.')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reveal review' }))

    expect(screen.getByText('Nick Fury is a skrull.')).toHaveClass('uppercase')
  })

  it('shows empty, loading, and error states for reviews', async () => {
    seedGroup()
    renderApp(`/groups/${GROUP_A}/titles/${IRON_ID}`)

    expect(
      await screen.findByRole('heading', { name: 'Ratings and reviews' }),
    ).toBeInTheDocument()
    expect(screen.getByText('No ratings yet.')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'No reviews yet' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Write review' })).toBeInTheDocument()
    expect(screen.queryByText(/Has not rated yet/)).not.toBeInTheDocument()
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

  it('shows a glowing review bubble on the watchlist and previews reviews on click', async () => {
    const user = userEvent.setup()
    seedGroup()
    setMockReviews([
      makeReview({
        id: '77777777-7777-4777-8777-777777777777',
        group_id: GROUP_A,
        user_id: OWNER_ID,
        title_id: IRON_ID,
        rating: 8.5,
        body: 'A strong start.',
        contains_spoilers: false,
      }),
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
    renderApp(`/groups/${GROUP_A}/watchlist`)

    expect(await screen.findByRole('heading', { name: 'Watchlist' })).toBeInTheDocument()
    const bubbles = screen.getAllByRole('button', {
      name: '2 reviews for Iron Man',
    })
    expect(bubbles.length).toBeGreaterThan(0)
    expect(
      screen.queryByRole('button', { name: /reviews? for WandaVision/i }),
    ).not.toBeInTheDocument()

    const [bubble] = bubbles
    if (!bubble) {
      throw new Error('expected a review bubble')
    }
    await user.click(bubble)

    expect(await screen.findByText('Owner A (you)')).toBeInTheDocument()
    expect(screen.getAllByText('A strong start.').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Member B').length).toBeGreaterThan(0)
    const preview = screen.getByText('Owner A (you)').closest('li')
    expect(preview).not.toBeNull()
    expect(preview!.querySelector('img')).toHaveAttribute(
      'src',
      '/profile-icons/iron-man.svg',
    )
    const memberPreview = screen.getAllByText('Member B')[0]?.closest('li')
    expect(memberPreview?.querySelector('img')).toHaveAttribute(
      'src',
      '/profile-icons/spider-man.svg',
    )
    expect(screen.getAllByText('This review contains spoilers.').length).toBeGreaterThan(0)
    expect(screen.queryByText('Nick Fury is a skrull.')).not.toBeInTheDocument()
  })
})
