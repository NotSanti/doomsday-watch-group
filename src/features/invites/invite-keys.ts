export const inviteKeys = {
  list: (groupId: string) => ['groups', 'detail', groupId, 'invites'] as const,
}
