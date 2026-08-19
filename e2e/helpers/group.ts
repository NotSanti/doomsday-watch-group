import type { Page } from '@playwright/test'
import { parseInviteToken } from '../../src/features/invites/invite-link'

export async function createGroup(
  page: Page,
  input: { name: string; description?: string },
): Promise<string> {
  await page.goto('/app')
  await page.getByRole('button', { name: 'Create group' }).click()
  await page.getByLabel('Group name').fill(input.name)
  if (input.description) {
    await page.getByLabel('Description (optional)').fill(input.description)
  }
  await page.getByRole('button', { name: 'Create group' }).click()
  await page.waitForURL(/\/groups\/[0-9a-f-]+$/)
  return groupIdFromUrl(page.url())
}

export function groupIdFromUrl(url: string): string {
  const match = /\/groups\/([0-9a-f-]+)/.exec(url)
  if (!match?.[1]) {
    throw new Error(`Could not parse group id from ${url}`)
  }

  return match[1]
}

export async function createInviteLink(page: Page): Promise<string> {
  await page.goto(`${groupPath(page)}/settings`)
  await page.getByRole('button', { name: 'Create invite' }).click()
  await page.getByLabel('Expires').selectOption('never')
  await page.getByRole('button', { name: 'Create invite' }).click()
  const inviteUrl = await page
    .getByRole('textbox', { name: 'Invite link' })
    .inputValue()
  await page.keyboard.press('Escape')
  return parseInviteToken(inviteUrl)
}

export function groupPath(page: Page): string {
  return `/groups/${groupIdFromUrl(page.url())}`
}
