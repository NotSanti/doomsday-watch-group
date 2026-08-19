import { describe, expect, it } from 'vitest'
import {
  toFriendlyTitleDetailError,
  toFriendlyTitleListError,
} from '@/features/watchlist/title-errors'

describe('title errors', () => {
  it('uses generic fallbacks without exposing backend text', () => {
    expect(toFriendlyTitleListError()).toBe(
      'The watchlist could not be loaded. Please try again.',
    )
    expect(toFriendlyTitleDetailError()).toBe(
      'This title could not be loaded. Please try again.',
    )
  })
})
