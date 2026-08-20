import { describe, expect, it } from 'vitest'
import { getPwaPushPermissionAction } from '@/features/notifications/pwa-push-permission'

describe('getPwaPushPermissionAction', () => {
  it('accepts an empty call and skips in a normal browser test env', () => {
    expect(getPwaPushPermissionAction()).toBe('skip')
  })

  it('skips outside standalone PWA', () => {
    expect(
      getPwaPushPermissionAction({
        isStandalone: false,
        supported: true,
        configured: true,
        permission: 'default',
      }),
    ).toBe('skip')
  })

  it('skips when push is unsupported or unconfigured', () => {
    expect(
      getPwaPushPermissionAction({
        isStandalone: true,
        supported: false,
        configured: true,
        permission: 'default',
      }),
    ).toBe('skip')

    expect(
      getPwaPushPermissionAction({
        isStandalone: true,
        supported: true,
        configured: false,
        permission: 'default',
      }),
    ).toBe('skip')
  })

  it('skips when the user previously denied access', () => {
    expect(
      getPwaPushPermissionAction({
        isStandalone: true,
        supported: true,
        configured: true,
        permission: 'denied',
      }),
    ).toBe('skip')
  })

  it('requests when permission was never asked', () => {
    expect(
      getPwaPushPermissionAction({
        isStandalone: true,
        supported: true,
        configured: true,
        permission: 'default',
      }),
    ).toBe('request')
  })

  it('requests when already granted so this device can subscribe', () => {
    expect(
      getPwaPushPermissionAction({
        isStandalone: true,
        supported: true,
        configured: true,
        permission: 'granted',
      }),
    ).toBe('request')
  })
})
