import {
  GROUPS_LIST_NAV_STATE,
  isGroupsListNavState,
  maybeAutoSelectSingleGroup,
  readHomeGroupPreference,
  resolveActiveHomeGroupId,
  toggleHomeGroupPreference,
  writeHomeGroupPreference,
} from '@/features/groups/home-group'

const USER = '11111111-1111-4111-8111-111111111111'
const GROUP_A = '22222222-2222-4222-8222-222222222222'
const GROUP_B = '33333333-3333-4333-8333-333333333333'

describe('home group preference', () => {
  it('treats missing storage as unset and auto-selects a lone group', () => {
    expect(readHomeGroupPreference(USER)).toEqual({ kind: 'unset' })
    expect(
      maybeAutoSelectSingleGroup([GROUP_A], { kind: 'unset' }),
    ).toEqual({ kind: 'group', id: GROUP_A })
    expect(
      maybeAutoSelectSingleGroup([GROUP_A, GROUP_B], { kind: 'unset' }),
    ).toEqual({ kind: 'unset' })
  })

  it('does not override an explicit none or stored group', () => {
    expect(
      maybeAutoSelectSingleGroup([GROUP_A], { kind: 'none' }),
    ).toEqual({ kind: 'none' })
    expect(
      maybeAutoSelectSingleGroup([GROUP_A], { kind: 'group', id: GROUP_B }),
    ).toEqual({ kind: 'group', id: GROUP_B })
  })

  it('resolves the active home only when the user still belongs to it', () => {
    expect(
      resolveActiveHomeGroupId([GROUP_A, GROUP_B], {
        kind: 'group',
        id: GROUP_B,
      }),
    ).toBe(GROUP_B)
    expect(
      resolveActiveHomeGroupId([GROUP_A], { kind: 'group', id: GROUP_B }),
    ).toBeNull()
    expect(resolveActiveHomeGroupId([GROUP_A], { kind: 'none' })).toBeNull()
  })

  it('toggles a single active home group and persists through storage', () => {
    expect(toggleHomeGroupPreference({ kind: 'unset' }, GROUP_A)).toEqual({
      kind: 'group',
      id: GROUP_A,
    })
    expect(
      toggleHomeGroupPreference({ kind: 'group', id: GROUP_A }, GROUP_B),
    ).toEqual({ kind: 'group', id: GROUP_B })
    expect(
      toggleHomeGroupPreference({ kind: 'group', id: GROUP_A }, GROUP_A),
    ).toEqual({ kind: 'none' })

    writeHomeGroupPreference(USER, { kind: 'group', id: GROUP_A })
    expect(readHomeGroupPreference(USER)).toEqual({
      kind: 'group',
      id: GROUP_A,
    })
    writeHomeGroupPreference(USER, { kind: 'none' })
    expect(readHomeGroupPreference(USER)).toEqual({ kind: 'none' })
  })

  it('detects navbar visits to the groups list', () => {
    expect(isGroupsListNavState(GROUPS_LIST_NAV_STATE)).toBe(true)
    expect(isGroupsListNavState(null)).toBe(false)
    expect(isGroupsListNavState({ source: 'other' })).toBe(false)
  })
})
