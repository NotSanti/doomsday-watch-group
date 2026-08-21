import { describe, expect, it } from 'vitest'
import { getAppVersionLabel } from '@/lib/app-version'

describe('getAppVersionLabel', () => {
  it('includes the package version', () => {
    expect(getAppVersionLabel()).toMatch(/^v0\.1\.0/)
  })
})
