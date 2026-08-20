import { expect, test } from '@playwright/test'
import { signUp } from './helpers/auth'
import { PASSWORD, uniqueEmail } from './helpers/constants'

test('keyboard user can sign in from the auth form', async ({ page }) => {
  const user = {
    email: uniqueEmail('keyboard-user'),
    password: PASSWORD,
    displayName: 'Keyboard User',
  }

  await signUp(page, user)

  await page.getByRole('button', { name: 'Sign out' }).click()
  await page.waitForURL(/\/auth/)

  await page.goto('/auth')
  await page.getByLabel('Email').focus()
  await page.keyboard.type(user.email)
  await page.keyboard.press('Tab')
  await page.keyboard.type(user.password)
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')

  await page.waitForURL(/\/app/)
  await expect(page.getByRole('heading', { name: 'Your groups' })).toBeVisible()
})

test('keyboard user can open create-group dialog', async ({ page }) => {
  const user = {
    email: uniqueEmail('keyboard-group'),
    password: PASSWORD,
    displayName: 'Keyboard Group Owner',
  }

  await signUp(page, user)

  await page.getByRole('button', { name: 'Create group' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByLabel('Group name')).toBeVisible()
})
