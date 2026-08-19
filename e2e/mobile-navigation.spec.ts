import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { signUp } from './helpers/auth'
import { PASSWORD, uniqueEmail } from './helpers/constants'
import { createGroup } from './helpers/group'

test('mobile navigation reaches core group screens', async ({ page }) => {
  const owner = {
    email: uniqueEmail('mobile-owner'),
    password: PASSWORD,
    displayName: 'Mobile Owner',
  }

  await signUp(page, owner)
  await createGroup(page, { name: 'Mobile Nav Squad' })

  await page.getByRole('link', { name: 'Watchlist' }).click()
  await expect(page.getByRole('heading', { name: 'Watchlist' })).toBeVisible()

  await page.getByRole('link', { name: 'Members' }).click()
  await expect(page.getByRole('heading', { name: 'Members' })).toBeVisible()

  await page.getByRole('link', { name: 'Settings' }).click()
  await expect(
    page.getByRole('heading', { name: 'Group settings' }),
  ).toBeVisible()

  await page.getByRole('link', { name: 'Dashboard' }).click()
  await expect(
    page.getByRole('heading', { name: 'Now watching' }),
  ).toBeVisible()
})

test('dashboard has no serious accessibility violations', async ({ page }) => {
  const owner = {
    email: uniqueEmail('a11y-owner'),
    password: PASSWORD,
    displayName: 'A11y Owner',
  }

  await signUp(page, owner)
  await createGroup(page, { name: 'A11y Squad' })

  const results = await new AxeBuilder({ page })
    .disableRules(['color-contrast'])
    .analyze()

  expect(results.violations.filter((v) => v.impact === 'serious')).toEqual([])
})
