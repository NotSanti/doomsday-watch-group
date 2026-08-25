import {
  computeDoomsdayPacing,
  formatDailyPace,
  formatHoursLeft,
  titleWatchMinutes,
} from '@/features/progress/doomsday-pacing'
import type { GroupProgressRow } from '@/features/progress/progress-schemas'
import type { TitleRow } from '@/features/watchlist/title-schemas'

const IRON = 'aa000000-0000-4000-8000-000000000001'
const WANDA = 'aa000000-0000-4000-8000-000000000002'
const THOR = 'aa000000-0000-4000-8000-000000000003'
const OWNER = '11111111-1111-4111-8111-111111111111'
const MEMBER = '55555555-5555-4555-8555-555555555555'
const TARGET = '2026-12-18T05:00:00.000Z'
const ZONE = 'America/Toronto'
const NOW = new Date('2026-08-25T16:00:00.000Z')

function title(
  id: string,
  overrides: Partial<TitleRow> = {},
): TitleRow {
  return {
    id,
    tmdb_id: 1,
    media_type: 'movie',
    name: id,
    release_date: '2008-05-02',
    runtime_minutes: 120,
    episode_count: null,
    poster_path: null,
    backdrop_path: null,
    synopsis: null,
    phase: 1,
    saga: 'Infinity Saga',
    era: 'Phase 1',
    importance: 'essential',
    release_order: 1,
    doomsday_order: 1,
    is_active: true,
    ...overrides,
  }
}

const titles = [
  title(IRON, { name: 'Iron Man', doomsday_order: 1, runtime_minutes: 120 }),
  title(WANDA, {
    name: 'WandaVision',
    media_type: 'series',
    doomsday_order: 2,
    runtime_minutes: null,
    episode_count: 6,
  }),
  title(THOR, { name: 'Thor', doomsday_order: 3, runtime_minutes: 60 }),
]

function watched(
  userId: string,
  titleId: string,
  watchedAt: string,
): Pick<GroupProgressRow, 'user_id' | 'title_id' | 'status' | 'watched_at'> {
  return {
    user_id: userId,
    title_id: titleId,
    status: 'watched',
    watched_at: watchedAt,
  }
}

describe('doomsday pacing', () => {
  it('estimates series runtime from episode count when needed', () => {
    expect(titleWatchMinutes(titles[1]!)).toBe(270)
  })

  it('sums remaining Doomsday-path hours for unwatched titles', () => {
    const pacing = computeDoomsdayPacing({
      titles,
      skippedTitleIds: new Set(),
      memberIds: [OWNER, MEMBER],
      progress: [],
      targetDateIso: TARGET,
      timeZone: ZONE,
      now: NOW,
    })

    expect(pacing.remainingTitleCount).toBe(3)
    expect(pacing.completedTodayCount).toBe(0)
    expect(pacing.remainingHours).toBe(8)
    expect(pacing.daysUntilDoomsday).toBe(115)
    expect(pacing.titlesPerDay).toBe(1)
    expect(formatHoursLeft(pacing.remainingHours)).toBe('8 hours')
    expect(formatDailyPace(pacing.titlesPerDay)).toBe('1')
  })

  it('drops a ceiled daily pace to zero when the group finishes a title today', () => {
    const before = computeDoomsdayPacing({
      titles,
      skippedTitleIds: new Set(),
      memberIds: [OWNER, MEMBER],
      progress: [],
      targetDateIso: TARGET,
      timeZone: ZONE,
      now: NOW,
    })
    expect(before.titlesPerDay).toBe(1)

    const after = computeDoomsdayPacing({
      titles,
      skippedTitleIds: new Set(),
      memberIds: [OWNER, MEMBER],
      progress: [
        watched(OWNER, IRON, '2026-08-25T18:00:00.000Z'),
        watched(MEMBER, IRON, '2026-08-25T19:00:00.000Z'),
      ],
      targetDateIso: TARGET,
      timeZone: ZONE,
      now: NOW,
    })

    expect(after.remainingTitleCount).toBe(2)
    expect(after.completedTodayCount).toBe(1)
    expect(after.remainingHours).toBe(6)
    expect(after.titlesPerDay).toBe(0)
    expect(formatDailyPace(after.titlesPerDay)).toBe('0')
  })

  it('keeps a start-of-day quota above one until the group catches up', () => {
    const nearTarget = computeDoomsdayPacing({
      titles,
      skippedTitleIds: new Set(),
      memberIds: [OWNER, MEMBER],
      progress: [],
      targetDateIso: '2026-08-27T04:00:00.000Z',
      timeZone: ZONE,
      now: NOW,
    })
    expect(nearTarget.daysUntilDoomsday).toBe(2)
    expect(nearTarget.titlesPerDay).toBe(1.5)

    const afterWatch = computeDoomsdayPacing({
      titles,
      skippedTitleIds: new Set(),
      memberIds: [OWNER, MEMBER],
      progress: [
        watched(OWNER, IRON, '2026-08-25T18:00:00.000Z'),
        watched(MEMBER, IRON, '2026-08-25T19:00:00.000Z'),
      ],
      targetDateIso: '2026-08-27T04:00:00.000Z',
      timeZone: ZONE,
      now: NOW,
    })
    expect(afterWatch.titlesPerDay).toBe(0.5)
    expect(formatDailyPace(afterWatch.titlesPerDay)).toBe('0.5')
  })

  it('ignores skipped and off-path titles and titles finished before today', () => {
    const pacing = computeDoomsdayPacing({
      titles: [
        ...titles,
        title('aa000000-0000-4000-8000-000000000099', {
          name: 'Off path',
          doomsday_order: null,
          runtime_minutes: 180,
        }),
      ],
      skippedTitleIds: new Set([THOR]),
      memberIds: [OWNER, MEMBER],
      progress: [
        watched(OWNER, IRON, '2026-08-24T18:00:00.000Z'),
        watched(MEMBER, IRON, '2026-08-24T19:00:00.000Z'),
      ],
      targetDateIso: TARGET,
      timeZone: ZONE,
      now: NOW,
    })

    expect(pacing.remainingTitleCount).toBe(1)
    expect(pacing.completedTodayCount).toBe(0)
    expect(pacing.remainingHours).toBe(5)
  })
})
