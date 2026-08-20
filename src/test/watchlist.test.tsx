import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TMDB_CREDIT } from '@/features/watchlist/TmdbCredit'
import {
  applyWatchlistFilters,
  filterDialog,
  openWatchlistFilters,
} from '@/test/mobile-ui'
import { renderApp } from '@/test/render-app'
import {
  makeGroup,
  makeProfile,
  makeReview,
  makeSession,
  makeTitle,
  makeTitleProgress,
  setMockGroups,
  setMockProfile,
  setMockProgress,
  setMockReviews,
  setMockSession,
  setMockTitles,
} from '@/test/supabase-mock'

const GROUP_A = '22222222-2222-4222-8222-222222222222'
const IRON_MAN_ID = 'aa000000-0000-4000-8000-000000000001'
const WANDA_ID = 'aa000000-0000-4000-8000-000000000020'
const WEREWOLF_ID = 'aa000000-0000-4000-8000-000000000030'
const MISSING_ID = 'aa000000-0000-4000-8000-000000000404'

function signInAsOwner(): void {
  setMockSession(makeSession())
  setMockProfile(makeProfile())
  setMockGroups([makeGroup({ id: GROUP_A, name: 'Alpha Watch' })])
}

function seedCatalog(): void {
  setMockTitles([
    makeTitle({
      id: IRON_MAN_ID,
      name: 'Iron Man',
      media_type: 'movie',
      importance: 'essential',
      release_order: 1,
      doomsday_order: 3,
    }),
    makeTitle({
      id: WANDA_ID,
      name: 'WandaVision',
      media_type: 'series',
      importance: 'recommended',
      runtime_minutes: null,
      episode_count: 9,
      poster_path: null,
      backdrop_path: null,
      synopsis: 'A sitcom reality begins to crack.',
      era: 'Phase 4 — The Blip & New Beginnings (2023)',
      release_order: 23,
      doomsday_order: 1,
    }),
    makeTitle({
      id: WEREWOLF_ID,
      name: 'Werewolf by Night',
      media_type: 'special',
      importance: 'optional',
      runtime_minutes: 53,
      poster_path: null,
      era: 'Phase 4 — Multiverse Opens (2024–2025)',
      release_order: 30,
      doomsday_order: 2,
    }),
    makeTitle({
      id: 'aa000000-0000-4000-8000-000000000099',
      name: 'Hidden Title',
      is_active: false,
      release_order: 99,
      doomsday_order: 99,
    }),
  ])
  setMockProgress([
    makeTitleProgress({
      group_id: GROUP_A,
      title_id: IRON_MAN_ID,
      status: 'watched',
    }),
    makeTitleProgress({
      group_id: GROUP_A,
      title_id: WANDA_ID,
      status: 'watching',
    }),
  ])
}

describe('watchlist', () => {
  it('lists active titles with counts, order, and TMDB credit', async () => {
    signInAsOwner()
    seedCatalog()
    renderApp(`/groups/${GROUP_A}/watchlist`)

    expect(
      await screen.findByRole('heading', { name: 'Watchlist' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/one catalog entry each, not per episode/i),
    ).toBeInTheDocument()
    expect(screen.getByText('Showing 3 of 3 titles')).toBeInTheDocument()
    expect(screen.queryByText('Hidden Title')).not.toBeInTheDocument()
    expect(screen.getAllByText('WandaVision').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Werewolf by Night').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Iron Man').length).toBeGreaterThan(0)
    expect(screen.getAllByText('FILM').length).toBeGreaterThan(0)
    expect(screen.getAllByText('TV').length).toBeGreaterThan(0)
    expect(screen.getAllByText('SPC').length).toBeGreaterThan(0)
    expect(screen.getAllByText('1/1 watched').length).toBeGreaterThan(0)
    expect(
      screen.getByRole('heading', {
        name: 'Phase 4 — The Blip & New Beginnings (2023)',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: 'Phase 4 — Multiverse Opens (2024–2025)',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: 'Phase 1 — The Avengers Initiative (2008–2012)',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText(TMDB_CREDIT, { exact: false })).toBeInTheDocument()
  })

  it('restores search and filters from the URL', async () => {
    const user = userEvent.setup()
    signInAsOwner()
    seedCatalog()
    renderApp(
      `/groups/${GROUP_A}/watchlist?q=Iron&type=movie&status=watched&sort=release`,
    )

    expect(
      await screen.findByRole('heading', { name: 'Watchlist' }),
    ).toBeInTheDocument()
    await openWatchlistFilters(user)
    const filters = within(filterDialog())
    expect(filters.getByLabelText('Search')).toHaveValue('Iron')
    expect(filters.getByLabelText('Type')).toHaveValue('movie')
    expect(filters.getByLabelText('My status')).toHaveValue('watched')
    expect(filters.getByLabelText('Order')).toHaveValue('release')
    expect(filters.getByLabelText('Show rating')).toBeChecked()
    expect(filters.getByLabelText('Show reviews')).toBeChecked()
    expect(screen.getByText('4 selected')).toBeInTheDocument()
    expect(screen.getByText('Showing 1 of 3 titles')).toBeInTheDocument()
    expect(screen.getAllByText('Iron Man').length).toBeGreaterThan(0)
    expect(screen.queryByText('WandaVision')).not.toBeInTheDocument()

    const [titleLink] = screen.getAllByRole('link', { name: /Iron Man/ })
    if (!titleLink) {
      throw new Error('expected Iron Man link')
    }
    expect(titleLink).toHaveAttribute(
      'href',
      `/groups/${GROUP_A}/titles/${IRON_MAN_ID}?q=Iron&type=movie&status=watched&sort=release`,
    )
  })

  it('keeps filter state in the URL across title navigation', async () => {
    const user = userEvent.setup()
    signInAsOwner()
    seedCatalog()
    renderApp(`/groups/${GROUP_A}/watchlist`)

    await screen.findByRole('heading', { name: 'Watchlist' })
    await openWatchlistFilters(user)
    const filters = within(filterDialog())
    await user.type(filters.getByLabelText('Search'), 'Wanda')
    await user.selectOptions(filters.getByLabelText('Type'), 'series')
    await applyWatchlistFilters(user)

    expect(screen.getByText('Showing 1 of 3 titles')).toBeInTheDocument()
    const [wandaLink] = screen.getAllByRole('link', { name: /WandaVision/ })
    if (!wandaLink) {
      throw new Error('expected WandaVision link')
    }
    await user.click(wandaLink)

    expect(
      await screen.findByRole('heading', { name: 'WandaVision' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('A sitcom reality begins to crack.'),
    ).toBeInTheDocument()
    expect(screen.getByText(/9 episodes/)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Not watching' }),
    ).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText(/0\/1 watched by the group/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Back to watchlist')).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: 'Ratings and reviews' }),
    ).toBeInTheDocument()
    expect(screen.getByText('No ratings yet.')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Back to watchlist'))

    expect(
      await screen.findByRole('heading', { name: 'Watchlist' }),
    ).toBeInTheDocument()
    await openWatchlistFilters(user)
    const restoredFilters = within(filterDialog())
    expect(restoredFilters.getByLabelText('Search')).toHaveValue('Wanda')
    expect(restoredFilters.getByLabelText('Type')).toHaveValue('series')
    expect(screen.getByText('Showing 1 of 3 titles')).toBeInTheDocument()
  })

  it('shows an empty state when filters match nothing', async () => {
    const user = userEvent.setup()
    signInAsOwner()
    seedCatalog()
    renderApp(`/groups/${GROUP_A}/watchlist`)

    await screen.findByRole('heading', { name: 'Watchlist' })
    await openWatchlistFilters(user)
    const emptyFilters = within(filterDialog())
    await user.type(emptyFilters.getByLabelText('Search'), 'not-a-title')
    await applyWatchlistFilters(user)

    expect(
      await screen.findByRole('heading', { name: 'No matching titles' }),
    ).toBeInTheDocument()
    await openWatchlistFilters(user)
    await user.click(within(filterDialog()).getByRole('button', { name: 'Clear all' }))
    await applyWatchlistFilters(user)
    expect(screen.getByText('Showing 3 of 3 titles')).toBeInTheDocument()
  })

  it('shows an empty catalog state when no titles load', async () => {
    signInAsOwner()
    setMockTitles([])
    renderApp(`/groups/${GROUP_A}/watchlist`)

    expect(
      await screen.findByRole('heading', { name: 'No titles yet' }),
    ).toBeInTheDocument()
  })

  it('shows a friendly error when the catalog cannot load', async () => {
    signInAsOwner()
    setMockTitles([], { message: 'column titles.secret does not exist' })
    renderApp(`/groups/${GROUP_A}/watchlist`)

    expect(
      await screen.findByText(
        'The watchlist could not be loaded. Please try again.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('column titles.secret does not exist'),
    ).not.toBeInTheDocument()
  })

  it('opens a metadata shell for a title and hides missing titles', async () => {
    signInAsOwner()
    seedCatalog()
    renderApp(`/groups/${GROUP_A}/titles/${IRON_MAN_ID}`)

    expect(
      await screen.findByRole('heading', { name: 'Iron Man' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/2008 · Movie · 126 min/i)).toBeInTheDocument()
    expect(screen.getByText('Essential')).toBeInTheDocument()
    expect(screen.getByText('Phase 1')).toBeInTheDocument()
    expect(
      screen.getByText('An industrialist builds a powered suit of armor.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Watched' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByText(/1\/1 watched by the group/i)).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: 'Ratings and reviews' }),
    ).toBeInTheDocument()
  })

  it('shows unavailable copy for unknown or inactive titles', async () => {
    signInAsOwner()
    seedCatalog()
    renderApp(`/groups/${GROUP_A}/titles/${MISSING_ID}`)

    expect(
      await screen.findByRole('heading', { name: 'Title not available' }),
    ).toBeInTheDocument()
  })

  it('shows a friendly error when title detail cannot load', async () => {
    signInAsOwner()
    setMockTitles([], { message: 'permission denied' })
    renderApp(`/groups/${GROUP_A}/titles/${IRON_MAN_ID}`)

    expect(
      await screen.findByText(
        'This title could not be loaded. Please try again.',
      ),
    ).toBeInTheDocument()
  })

  it('toggles rating and review content on listings', async () => {
    const user = userEvent.setup()
    signInAsOwner()
    seedCatalog()
    setMockReviews([
      makeReview({
        group_id: GROUP_A,
        title_id: IRON_MAN_ID,
        rating: 8.5,
        body: 'A strong start.',
      }),
    ])
    renderApp(`/groups/${GROUP_A}/watchlist`)

    expect(
      await screen.findByRole('heading', { name: 'Watchlist' }),
    ).toBeInTheDocument()
    await openWatchlistFilters(user)
    const toggleFilters = within(filterDialog())
    expect(toggleFilters.getByLabelText('Show rating')).toBeChecked()
    expect(toggleFilters.getByLabelText('Show reviews')).toBeChecked()
    await applyWatchlistFilters(user)
    expect(screen.getAllByText('Avg 8.5').length).toBeGreaterThan(0)
    expect(
      screen.getAllByRole('button', { name: '1 review for Iron Man' }).length,
    ).toBeGreaterThan(0)

    await openWatchlistFilters(user)
    const ratingFilters = within(filterDialog())
    await user.click(ratingFilters.getByLabelText('Show rating'))
    expect(ratingFilters.getByLabelText('Show rating')).not.toBeChecked()
    await applyWatchlistFilters(user)
    expect(screen.queryByText('Avg 8.5')).not.toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: '1 review for Iron Man' }).length,
    ).toBeGreaterThan(0)

    await openWatchlistFilters(user)
    const reviewFilters = within(filterDialog())
    await user.click(reviewFilters.getByLabelText('Show reviews'))
    expect(reviewFilters.getByLabelText('Show reviews')).not.toBeChecked()
    await applyWatchlistFilters(user)
    expect(
      screen.queryByRole('button', { name: '1 review for Iron Man' }),
    ).not.toBeInTheDocument()

    const [titleLink] = screen.getAllByRole('link', { name: /Iron Man/ })
    if (!titleLink) {
      throw new Error('expected Iron Man link')
    }
    expect(titleLink).toHaveAttribute(
      'href',
      `/groups/${GROUP_A}/titles/${IRON_MAN_ID}?showRating=0&showReviews=0`,
    )
  })
})

describe('about credits', () => {
  it('shows the unofficial disclaimer and TMDB credit', async () => {
    renderApp('/about')

    expect(
      await screen.findByRole('heading', { name: 'About' }),
    ).toBeInTheDocument()
    const main = screen.getByRole('main')
    expect(
      within(main).getByText(
        /unofficial fan project\. not affiliated with or endorsed by marvel or disney/i,
      ),
    ).toBeInTheDocument()
    expect(
      within(main).getByText(TMDB_CREDIT, { exact: false }),
    ).toBeInTheDocument()
  })
})
