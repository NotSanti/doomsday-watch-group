export const IRON_MAN_TITLE_ID = 'aa000000-0000-4000-8000-000000000001'
export const WANDA_TITLE_ID = 'aa000000-0000-4000-8000-000000000018'

export const PASSWORD = 'E2eTestPass123!'

export function uniqueEmail(label: string): string {
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return `e2e-${slug}-${String(Date.now())}@example.test`
}
