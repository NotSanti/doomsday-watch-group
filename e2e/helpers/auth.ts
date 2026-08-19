import type { Page } from '@playwright/test'

export async function signUp(
  page: Page,
  input: { email: string; password: string; displayName: string },
): Promise<void> {
  await page.goto('/auth?mode=signup')
  await page.getByLabel('Display name').fill(input.displayName)
  await page.getByLabel('Email').fill(input.email)
  await page.getByLabel('Password', { exact: true }).fill(input.password)
  await page.getByRole('button', { name: 'Create account' }).click()
  await page.waitForURL(/\/app/)
}

export async function signIn(
  page: Page,
  input: { email: string; password: string },
  returnTo = '/app',
): Promise<void> {
  await page.goto(`/auth?returnTo=${encodeURIComponent(returnTo)}`)
  await page.getByLabel('Email').fill(input.email)
  await page.getByLabel('Password', { exact: true }).fill(input.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL(
    new RegExp(returnTo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
  )
}
