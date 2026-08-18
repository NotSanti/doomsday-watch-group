export const groupKeys = {
  all: ['groups'] as const,
  list: (userId: string) => ['groups', 'list', userId] as const,
  detail: (groupId: string) => ['groups', 'detail', groupId] as const,
  members: (groupId: string) => ['groups', 'members', groupId] as const,
  memberLists: (userId: string) => ['groups', 'members-list', userId] as const,
}

export function isGroupScopedQueryKey(queryKey: readonly unknown[]): boolean {
  return queryKey[0] === 'groups' && queryKey[1] === 'detail'
}
