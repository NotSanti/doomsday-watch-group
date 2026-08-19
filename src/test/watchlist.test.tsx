import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { TMDB_CREDIT } from '@/features/watchlist/TmdbCredit'
import { renderApp } from '@/test/render-app'
import {
  makeGroup,
  makeProfile,
  makeSession,
  makeTitle,
  makeTitleProgress,
  setMockGroups,
  setMockProfile,
  setMockProgress,
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
    expect(screen.getByText(TMDB_CREDIT, { exact: false })).toBeInTheDocument()
  })

  it('restores search and filters from the URL', async () => {
    signInAsOwner()
    seedCatalog()
    renderApp(
      `/groups/${GROUP_A}/watchlist?q=Iron&type=movie&status=watched&sort=release`,
    )

    expect(
      await screen.findByRole('heading', { name: 'Watchlist' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Search')).toHaveValue('Iron')
    expect(screen.getByLabelText('Type')).toHaveValue('movie')
    expect(screen.getByLabelText('My status')).toHaveValue('watched')
    expect(screen.getByLabelText('Order')).toHaveValue('release')
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
    await user.type(screen.getByLabelText('Search'), 'Wanda')
    await user.selectOptions(screen.getByLabelText('Type'), 'series')

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
      screen.getByText(
        /personal status, ratings, and reviews arrive in later milestones/i,
      ),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Back to watchlist' }))

    expect(
      await screen.findByRole('heading', { name: 'Watchlist' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Search')).toHaveValue('Wanda')
    expect(screen.getByLabelText('Type')).toHaveValue('series')
    expect(screen.getByText('Showing 1 of 3 titles')).toBeInTheDocument()
  })

  it('shows an empty state when filters match nothing', async () => {
    const user = userEvent.setup()
    signInAsOwner()
    seedCatalog()
    renderApp(`/groups/${GROUP_A}/watchlist`)

    await screen.findByRole('heading', { name: 'Watchlist' })
    await user.type(screen.getByLabelText('Search'), 'not-a-title')

    expect(
      await screen.findByRole('heading', { name: 'No matching titles' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
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
      await screen.findByText('The watchlist could not be loaded. Please try again.'),
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
    expect(
      screen.queryByRole('combobox', { name: 'My status' }),
    ).not.toBeInTheDocument()
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
      await screen.findByText('This title could not be loaded. Please try again.'),
    ).toBeInTheDocument()
  })
})

describe('about credits', () => {
  it('shows the unofficial disclaimer and TMDB credit', async () => {
    renderApp('/about')

    expect(await screen.findByRole('heading', { name: 'About' })).toBeInTheDocument()
    const main = screen.getByRole('main')
    expect(
      within(main).getByText(
        /unofficial fan project\. not affiliated with or endorsed by marvel or disney/i,
      ),
    ).toBeInTheDocument()
    expect(within(main).getByText(TMDB_CREDIT, { exact: false })).toBeInTheDocument()
  })
})
