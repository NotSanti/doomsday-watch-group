export const skipKeys = {
  group: (groupId: string) => ['groups', 'skipped-titles', groupId] as const,
}
