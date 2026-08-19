export const titleKeys = {
  all: ['titles'] as const,
  list: () => ['titles', 'list'] as const,
  detail: (titleId: string) => ['titles', 'detail', titleId] as const,
}
