import { expect, type Page } from '@playwright/test'

/** Dismiss the post-signup profile icon overlay when it blocks the app shell. */
export async function completeAvatarOnboardingIfNeeded(
  page: Page,
): Promise<void> {
  const saveIcon = page.getByRole('button', { name: 'Save icon' })
  const needsAvatar = await saveIcon
    .isVisible({ timeout: 2_000 })
    .catch(() => false)

  if (!needsAvatar) {
    return
  }

  await page.getByRole('radio').first().click()
  await saveIcon.click()
  await expect(saveIcon).toBeHidden({ timeout: 15_000 })
}

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
  await completeAvatarOnboardingIfNeeded(page)
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
  await completeAvatarOnboardingIfNeeded(page)
}
