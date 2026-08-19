export const reviewKeys = {
  all: ['reviews'] as const,
  group: (groupId: string) => ['reviews', 'group', groupId] as const,
}
