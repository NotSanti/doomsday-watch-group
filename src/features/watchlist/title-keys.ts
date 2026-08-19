export const titleKeys = {
  all: ['titles'] as const,
  list: () => ['titles', 'list'] as const,
  detail: (titleId: string) => ['titles', 'detail', titleId] as const,
  progress: (groupId: string, userId: string) =>
    ['titles', 'progress', groupId, userId] as const,
}
