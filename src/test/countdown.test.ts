import {
  formatCountdownClock,
  getCountdownParts,
  padUnit,
} from '@/lib/countdown'

describe('getCountdownParts', () => {
  it('splits a future duration into months, days, hours, minutes, and seconds', () => {
    const now = new Date('2026-08-18T12:00:00.000Z')
    const target = new Date('2026-08-20T13:04:05.000Z')
    const parts = getCountdownParts(now, target)

    expect(parts.elapsed).toBe(false)
    expect(parts.months).toBe(0)
    expect(parts.days).toBe(2)
    expect(parts.hours).toBe(1)
    expect(parts.minutes).toBe(4)
    expect(parts.seconds).toBe(5)
    expect(formatCountdownClock(parts)).toBe('00:02:01:04:05')
  })

  it('counts whole calendar months in the local timezone', () => {
    const now = new Date(2026, 7, 18, 12, 0, 0)
    const target = new Date(2026, 11, 18, 12, 0, 0)
    const parts = getCountdownParts(now, target)

    expect(parts.elapsed).toBe(false)
    expect(parts.months).toBe(4)
    expect(parts.days).toBe(0)
    expect(parts.hours).toBe(0)
    expect(parts.minutes).toBe(0)
    expect(parts.seconds).toBe(0)
    expect(formatCountdownClock(parts)).toBe('04:00:00:00:00')
  })

  it('treats the same instant as elapsed without negative units', () => {
    const now = new Date('2026-12-18T05:00:00.000Z')
    const parts = getCountdownParts(now, now)

    expect(parts.elapsed).toBe(true)
    expect(parts.months).toBe(0)
    expect(parts.days).toBe(0)
    expect(parts.hours).toBe(0)
    expect(parts.minutes).toBe(0)
    expect(parts.seconds).toBe(0)
  })

  it('treats a past target as elapsed regardless of timezone offset', () => {
    const now = new Date('2026-12-19T00:00:00-05:00')
    const target = new Date('2026-12-18T00:00:00-05:00')
    const parts = getCountdownParts(now, target)

    expect(parts.elapsed).toBe(true)
    expect(parts.totalMs).toBeLessThan(0)
  })
})

describe('padUnit', () => {
  it('zero-pads single digit values', () => {
    expect(padUnit(3)).toBe('03')
    expect(padUnit(12)).toBe('12')
  })
})
