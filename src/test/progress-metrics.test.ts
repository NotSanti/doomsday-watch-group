import { describe, expect, it } from 'vitest'
import {
  averageCompletionPercent,
  currentTitleCompletionPercent,
  groupWatchedFraction,
  progressStatusFor,
  titlesCompletedAsAGroup,
  upcomingTitles,
  watchedTitleCount,
} from '@/features/progress/progress-metrics'
import type { TitleRow } from '@/features/watchlist/title-schemas'

const IRON = 'aa000000-0000-4000-8000-000000000001'
const WANDA = 'aa000000-0000-4000-8000-000000000002'
const THOR = 'aa000000-0000-4000-8000-000000000003'
const OWNER = '11111111-1111-4111-8111-111111111111'
const MEMBER = '55555555-5555-4555-8555-555555555555'

const titles = [
  {
    id: IRON,
    name: 'Iron Man',
    is_active: true,
    doomsday_order: 1,
    release_order: 1,
  },
  {
    id: WANDA,
    name: 'WandaVision',
    is_active: true,
    doomsday_order: 2,
    release_order: 2,
  },
  {
    id: THOR,
    name: 'Thor',
    is_active: true,
    doomsday_order: 3,
    release_order: 3,
  },
] as TitleRow[]

const rows = [
  { user_id: OWNER, title_id: IRON, status: 'watched' as const },
  { user_id: OWNER, title_id: WANDA, status: 'watching' as const },
  { user_id: MEMBER, title_id: IRON, status: 'watched' as const },
]

describe('progress metrics', () => {
  it('treats missing rows as not started', () => {
    expect(progressStatusFor(rows, MEMBER, WANDA)).toBe('not_started')
  })

  it('counts a title completed as a group only when every member watched it', () => {
    expect(
      titlesCompletedAsAGroup([IRON, WANDA, THOR], [OWNER, MEMBER], rows),
    ).toBe(1)
  })

  it('averages each member’s watched-title percentage', () => {
    const activeIds = new Set([IRON, WANDA, THOR])

    expect(watchedTitleCount(rows, OWNER, activeIds)).toBe(1)
    expect(watchedTitleCount(rows, MEMBER, activeIds)).toBe(1)
    expect(
      averageCompletionPercent([OWNER, MEMBER], 3, rows, activeIds),
    ).toBeCloseTo(100 / 3)
  })

  it('reports current-title completion and per-title fractions', () => {
    expect(currentTitleCompletionPercent(IRON, [OWNER, MEMBER], rows)).toBe(100)
    expect(currentTitleCompletionPercent(WANDA, [OWNER, MEMBER], rows)).toBe(0)
    expect(currentTitleCompletionPercent(null, [OWNER, MEMBER], rows)).toBeNull()
    expect(groupWatchedFraction(IRON, [OWNER, MEMBER], rows)).toEqual({
      watched: 2,
      total: 2,
    })
  })

  it('returns the next three Doomsday-order titles after the current pick', () => {
    expect(upcomingTitles(titles, IRON).map((title) => title.name)).toEqual([
      'WandaVision',
      'Thor',
    ])
    expect(upcomingTitles(titles, null).map((title) => title.name)).toEqual([
      'Iron Man',
      'WandaVision',
      'Thor',
    ])
  })
})
