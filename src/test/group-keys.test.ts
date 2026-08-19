import { groupKeys, isGroupScopedQueryKey } from '@/features/groups/group-keys'

describe('group query keys', () => {
  it('scopes list keys by user and detail keys by group', () => {
    const userId = '11111111-1111-4111-8111-111111111111'
    const groupId = '22222222-2222-4222-8222-222222222222'

    expect(groupKeys.list(userId)).toEqual(['groups', 'list', userId])
    expect(groupKeys.detail(groupId)).toEqual(['groups', 'detail', groupId])
    expect(groupKeys.members(groupId)).toEqual(['groups', 'members', groupId])
    expect(isGroupScopedQueryKey(groupKeys.detail(groupId))).toBe(true)
    expect(isGroupScopedQueryKey(groupKeys.list(userId))).toBe(false)
    expect(isGroupScopedQueryKey(groupKeys.members(groupId))).toBe(false)
  })
})
