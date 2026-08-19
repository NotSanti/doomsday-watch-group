export const progressKeys = {
  all: ['progress'] as const,
  group: (groupId: string) => ['progress', 'group', groupId] as const,
}
