import { describe, expect, it } from 'vitest'
import { safeReturnTo } from '@/lib/return-to'

describe('safeReturnTo', () => {
  it('keeps in-app paths', () => {
    expect(safeReturnTo('/groups/abc')).toBe('/groups/abc')
    expect(safeReturnTo('/app?tab=1')).toBe('/app?tab=1')
  })

  it('rejects open redirects', () => {
    expect(safeReturnTo('https://evil.example')).toBe('/app')
    expect(safeReturnTo('//evil.example')).toBe('/app')
    expect(safeReturnTo('\\evil')).toBe('/app')
    expect(safeReturnTo(null)).toBe('/app')
  })
})
