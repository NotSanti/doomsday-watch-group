import {
  buildYearWatchGrid,
  calendarWeekday,
  monthLabelsForYear,
  shiftYear,
  watchCountInYear,
  weekIndexForDate,
  watchesByCalendarDate,
} from '@/features/members/watch-activity'

describe('watch activity', () => {
  const timeZone = 'America/Toronto'

  it('groups watched rows by calendar date in the group timezone', () => {
    const watches = watchesByCalendarDate(
      [
        {
          group_id: '22222222-2222-4222-8222-222222222222',
          user_id: '55555555-5555-4555-8555-555555555555',
          title_id: 'aa000000-0000-4000-8000-000000000001',
          status: 'watched',
          started_at: null,
          watched_at: '2026-04-01T04:00:00.000Z',
        },
        {
          group_id: '22222222-2222-4222-8222-222222222222',
          user_id: '55555555-5555-4555-8555-555555555555',
          title_id: 'aa000000-0000-4000-8000-000000000020',
          status: 'watched',
          started_at: null,
          watched_at: '2026-04-01T12:00:00.000Z',
        },
      ],
      '55555555-5555-4555-8555-555555555555',
      timeZone,
    )

    expect(watches.get('2026-04-01')).toBe(2)
    expect(watchCountInYear(watches, 2026)).toBe(2)
  })

  it('builds a GitHub-style year grid with active days for watches', () => {
    const watches = new Map([['2026-04-01', 1], ['2026-04-15', 1]])
    const { cells, weekCount } = buildYearWatchGrid(2026, watches, timeZone)

    expect(weekCount).toBeGreaterThanOrEqual(52)
    expect(calendarWeekday('2026-04-01', timeZone)).toBe(3)
    expect(weekIndexForDate('2026-04-01', timeZone)).toBeGreaterThan(0)

    const activeDays = cells
      .flat()
      .filter((cell): cell is NonNullable<typeof cell> => cell?.active === true)

    expect(activeDays.map((cell) => cell.day).sort((a, b) => a - b)).toEqual([
      1, 15,
    ])
    expect(activeDays.every((cell) => cell.month === 4)).toBe(true)
  })

  it('returns month labels positioned across the year', () => {
    const labels = monthLabelsForYear(2026, timeZone)

    expect(labels).toHaveLength(12)
    expect(labels[0]).toMatchObject({ label: 'Jan', weekIndex: 0 })
    expect(labels[3]?.label).toBe('Apr')
  })

  it('shifts years forward and backward', () => {
    expect(shiftYear(2026, -1)).toBe(2025)
    expect(shiftYear(2026, 1)).toBe(2027)
  })
})
