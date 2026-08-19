import { expect, test } from '@playwright/test'
import { signUp } from './helpers/auth'
import { PASSWORD, uniqueEmail } from './helpers/constants'
import { createGroup, createInviteLink } from './helpers/group'

test('outsider cannot open a private group dashboard', async ({ page }) => {
  const owner = {
    email: uniqueEmail('private-owner'),
    password: PASSWORD,
    displayName: 'Private Owner',
  }
  const outsider = {
    email: uniqueEmail('outsider'),
    password: PASSWORD,
    displayName: 'Outsider',
  }

  await signUp(page, owner)
  const groupId = await createGroup(page, { name: 'Private Squad' })

  await page.getByRole('button', { name: 'Sign out' }).click()
  await page.waitForURL(/\/auth/)

  await signUp(page, outsider)
  await page.goto(`/groups/${groupId}`)
  await expect(
    page.getByRole('heading', { name: 'Group not available' }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Back to your groups' }),
  ).toBeVisible()
})

test('revoked invite shows a friendly message', async ({ page }) => {
  const owner = {
    email: uniqueEmail('revoked-owner'),
    password: PASSWORD,
    displayName: 'Revoked Owner',
  }

  await signUp(page, owner)
  await createGroup(page, { name: 'Revoked Invite Squad' })
  const token = await createInviteLink(page)

  await page.getByRole('button', { name: 'Revoke' }).click()
  const dialog = page.getByRole('dialog', { name: 'Revoke invite' })
  await dialog.getByRole('button', { name: 'Revoke invite' }).click()
  await expect(page.getByRole('button', { name: 'Revoke' })).toHaveCount(0)

  await page.goto(`/invite/${token}`)
  await expect(
    page.getByRole('heading', { name: 'Join a watch group' }),
  ).toBeVisible()
  await expect(page.getByText('This invite was revoked.')).toBeVisible()
})

test('invalid invite token is rejected', async ({ page }) => {
  await page.goto('/invite/not-a-real-invite-token')
  await expect(
    page.getByRole('heading', { name: 'Join a watch group' }),
  ).toBeVisible()
  await expect(page.getByText('This invite is not valid.')).toBeVisible()
})
