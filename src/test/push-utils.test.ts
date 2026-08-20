import { describe, expect, it } from 'vitest'
import {
  dailyCountdownMessage,
  countdownDaysUntil,
  getVapidPublicKey,
  isPushSupported,
  parsePushPayload,
} from '@/features/notifications/push-utils'

describe('push-utils', () => {
  it('computes whole days until the target date', () => {
    const target = new Date('2026-12-18T00:00:00-05:00')
    const now = new Date('2026-12-16T12:00:00-05:00')

    expect(countdownDaysUntil(target, now)).toBe(2)
  })

  it('builds the daily countdown notification copy', () => {
    const message = dailyCountdownMessage(
      new Date('2026-12-16T12:00:00-05:00'),
      new Date('2026-12-18T00:00:00-05:00'),
    )

    expect(message).toEqual({
      title: 'Road to Doomsday',
      body: '2 days until Doomsday.',
    })
  })

  it('returns null when Doomsday has passed', () => {
    expect(
      dailyCountdownMessage(
        new Date('2026-12-19T00:00:00-05:00'),
        new Date('2026-12-18T00:00:00-05:00'),
      ),
    ).toBeNull()
  })

  it('normalizes push payload fields', () => {
    expect(
      parsePushPayload({
        title: 'Group update',
        body: 'Member joined',
        url: '/groups/abc',
      }),
    ).toEqual({
      title: 'Group update',
      body: 'Member joined',
      url: '/groups/abc',
    })
  })

  it('reports push support in jsdom', () => {
    expect(isPushSupported()).toBe(false)
  })

  it('returns null when the VAPID public key is missing', () => {
    expect(getVapidPublicKey()).toBeNull()
  })
})
