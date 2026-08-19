import {
  countActiveWatchlistFilters,
  DEFAULT_WATCHLIST_FILTERS,
  filterTitles,
  parseWatchlistFilters,
  serializeWatchlistFilters,
  statusForTitle,
} from '@/features/watchlist/title-filters'
import type { TitleProgress, TitleRow } from '@/features/watchlist/title-schemas'

const ironMan = {
  id: 'aa000000-0000-4000-8000-000000000001',
  tmdb_id: 1726,
  media_type: 'movie',
  name: 'Iron Man',
  release_date: '2008-05-02',
  runtime_minutes: 126,
  episode_count: null,
  poster_path: '/poster.jpg',
  backdrop_path: null,
  synopsis: null,
  phase: 1,
  saga: 'Infinity Saga',
  era: 'Phase 1 — The Avengers Initiative (2008–2012)',
  importance: 'essential',
  release_order: 1,
  doomsday_order: 3,
  is_active: true,
} satisfies TitleRow

const wandaVision = {
  ...ironMan,
  id: 'aa000000-0000-4000-8000-000000000020',
  tmdb_id: 85271,
  media_type: 'series',
  name: 'WandaVision',
  release_date: '2021-01-15',
  runtime_minutes: null,
  episode_count: 9,
  importance: 'recommended',
  release_order: 23,
  doomsday_order: 1,
} satisfies TitleRow

const werewolf = {
  ...ironMan,
  id: 'aa000000-0000-4000-8000-000000000030',
  tmdb_id: 894640,
  media_type: 'special',
  name: 'Werewolf by Night',
  release_date: '2022-10-07',
  runtime_minutes: 53,
  episode_count: null,
  importance: 'optional',
  release_order: 30,
  doomsday_order: 2,
} satisfies TitleRow

const inactive = {
  ...ironMan,
  id: 'aa000000-0000-4000-8000-000000000099',
  name: 'Hidden Title',
  release_order: 99,
  doomsday_order: 99,
  is_active: false,
} satisfies TitleRow

const offPath = {
  ...ironMan,
  id: 'aa000000-0000-4000-8000-000000000040',
  tmdb_id: 524434,
  name: 'Eternals',
  release_date: '2021-11-05',
  importance: 'optional',
  release_order: 31,
  doomsday_order: null,
} satisfies TitleRow

const titles = [ironMan, wandaVision, werewolf, inactive, offPath]

const progress: TitleProgress[] = [
  { title_id: ironMan.id, status: 'watched' },
  { title_id: wandaVision.id, status: 'watching' },
]

describe('watchlist URL filters', () => {
  it('counts active filters against defaults', () => {
    expect(countActiveWatchlistFilters(DEFAULT_WATCHLIST_FILTERS)).toBe(0)
    expect(
      countActiveWatchlistFilters({
        ...DEFAULT_WATCHLIST_FILTERS,
        q: 'Iron',
        type: 'movie',
        showRating: false,
      }),
    ).toBe(3)
  })

  it('parses known params and ignores invalid values', () => {
    expect(
      parseWatchlistFilters(
        new URLSearchParams(
          'q=Iron&type=movie&importance=essential&status=watched&sort=release',
        ),
      ),
    ).toEqual({
      q: 'Iron',
      type: 'movie',
      importance: 'essential',
      status: 'watched',
      sort: 'release',
      showRating: true,
      showReviews: true,
    })
    expect(
      parseWatchlistFilters(
        new URLSearchParams('type=nope&status=later&sort=alpha'),
      ),
    ).toEqual(DEFAULT_WATCHLIST_FILTERS)
  })

  it('omits default values when serializing', () => {
    expect(serializeWatchlistFilters(DEFAULT_WATCHLIST_FILTERS).toString()).toBe(
      '',
    )
    expect(
      serializeWatchlistFilters({
        q: 'Wanda',
        type: 'series',
        importance: 'recommended',
        status: 'unwatched',
        sort: 'release',
        showRating: true,
        showReviews: true,
      }).toString(),
    ).toBe(
      'q=Wanda&type=series&importance=recommended&status=unwatched&sort=release',
    )
    expect(
      serializeWatchlistFilters({
        ...DEFAULT_WATCHLIST_FILTERS,
        showRating: false,
        showReviews: false,
      }).toString(),
    ).toBe('showRating=0&showReviews=0')
    expect(
      parseWatchlistFilters(new URLSearchParams('showRating=0&showReviews=0')),
    ).toEqual({
      ...DEFAULT_WATCHLIST_FILTERS,
      showRating: false,
      showReviews: false,
    })
  })
})

describe('filterTitles', () => {
  it('defaults missing progress to not started and hides inactive titles', () => {
    expect(statusForTitle(werewolf.id, progress)).toBe('not_started')
    expect(
      filterTitles(titles, progress, DEFAULT_WATCHLIST_FILTERS).map(
        (title) => title.name,
      ),
    ).toEqual(['WandaVision', 'Werewolf by Night', 'Iron Man'])
  })

  it('applies search, type, importance, and status together', () => {
    expect(
      filterTitles(titles, progress, {
        ...DEFAULT_WATCHLIST_FILTERS,
        q: 'iron',
        type: 'movie',
        importance: 'essential',
        status: 'watched',
      }).map((title) => title.name),
    ).toEqual(['Iron Man'])
    expect(
      filterTitles(titles, progress, {
        ...DEFAULT_WATCHLIST_FILTERS,
        type: 'series',
        status: 'unwatched',
      }).map((title) => title.name),
    ).toEqual(['WandaVision'])
    expect(
      filterTitles(titles, progress, {
        ...DEFAULT_WATCHLIST_FILTERS,
        importance: 'optional',
        status: 'unwatched',
      }).map((title) => title.name),
    ).toEqual(['Werewolf by Night'])
    expect(
      filterTitles(titles, progress, {
        ...DEFAULT_WATCHLIST_FILTERS,
        q: 'does-not-exist',
      }),
    ).toEqual([])
  })

  it('sorts by release order when requested', () => {
    expect(
      filterTitles(titles, progress, {
        ...DEFAULT_WATCHLIST_FILTERS,
        sort: 'release',
      }).map((title) => title.name),
    ).toEqual(['Iron Man', 'WandaVision', 'Werewolf by Night', 'Eternals'])
  })

  it('omits off-path titles from Doomsday order and keeps them in release order', () => {
    expect(
      filterTitles(titles, progress, DEFAULT_WATCHLIST_FILTERS).map(
        (title) => title.name,
      ),
    ).toEqual(['WandaVision', 'Werewolf by Night', 'Iron Man'])
    expect(
      filterTitles(titles, progress, {
        ...DEFAULT_WATCHLIST_FILTERS,
        sort: 'release',
      }).some((title) => title.name === 'Eternals'),
    ).toBe(true)
  })
})
