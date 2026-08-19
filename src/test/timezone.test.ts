import {
  calendarDateInTimeZone,
  formatDateInTimeZone,
  isGroupTimezone,
  zonedStartOfDayIso,
} from '@/lib/timezone'

describe('timezone helpers', () => {
  it('converts a Toronto midnight target into the local calendar date', () => {
    expect(
      calendarDateInTimeZone('2026-12-18T05:00:00.000Z', 'America/Toronto'),
    ).toBe('2026-12-18')
    expect(formatDateInTimeZone('2026-12-18T05:00:00.000Z', 'America/Toronto')).toMatch(
      /Dec/,
    )
  })

  it('stores the target date as midnight in the selected timezone', () => {
    expect(zonedStartOfDayIso('2026-12-18', 'America/Toronto')).toBe(
      '2026-12-18T05:00:00.000Z',
    )
    expect(zonedStartOfDayIso('2026-12-18', 'UTC')).toBe('2026-12-18T00:00:00.000Z')
  })

  it('accepts only curated IANA zones', () => {
    expect(isGroupTimezone('America/Toronto')).toBe(true)
    expect(isGroupTimezone('Not/AZone')).toBe(false)
  })
})
