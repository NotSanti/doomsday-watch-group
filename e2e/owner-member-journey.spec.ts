import { expect, test } from '@playwright/test'
import { signIn, signUp } from './helpers/auth'
import { IRON_MAN_TITLE_ID, PASSWORD, uniqueEmail, WANDA_TITLE_ID } from './helpers/constants'
import { createGroup, createInviteLink } from './helpers/group'

test.describe.configure({ mode: 'serial' })

test.describe('owner and member journey', () => {
  const owner = {
    email: uniqueEmail('owner'),
    password: PASSWORD,
    displayName: 'E2E Owner',
  }
  const member = {
    email: uniqueEmail('member'),
    password: PASSWORD,
    displayName: 'E2E Member',
  }

  let inviteToken = ''
  let groupId = ''

  test('owner creates a group and invite', async ({ page }) => {
    await signUp(page, owner)
    groupId = await createGroup(page, {
      name: 'E2E Watch Squad',
      description: 'Playwright journey group',
    })
    inviteToken = await createInviteLink(page)

    expect(groupId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )
    expect(inviteToken.length).toBeGreaterThan(10)
  })

  test('member joins, watches, and reviews a title', async ({ browser }) => {
    const memberContext = await browser.newContext()
    const memberPage = await memberContext.newPage()

    await signUp(memberPage, member)
    await memberPage.goto(`/invite/${inviteToken}`)
    await expect(
      memberPage.getByRole('heading', { name: 'Join a watch group' }),
    ).toBeVisible()
    await memberPage.getByRole('button', { name: 'Join group' }).click()
    await memberPage.waitForURL(new RegExp(`/groups/${groupId}`))

    await memberPage.goto(`/groups/${groupId}/titles/${IRON_MAN_TITLE_ID}`)
    await expect(
      memberPage.getByRole('heading', { name: 'Ratings and reviews' }),
    ).toBeVisible()

    const status = memberPage.getByRole('button', { name: 'Not watching' })
    await status.click()
    await expect(
      memberPage.getByRole('button', { name: 'Watched' }),
    ).toHaveAttribute('aria-pressed', 'true')

    await memberPage.locator('input[type="radio"][value="8"]').click({ force: true })
    await memberPage
      .getByLabel('Review (optional)')
      .fill('Great start for the journey.')
    await memberPage.getByRole('button', { name: 'Save review' }).click()

    await expect(
      memberPage.getByRole('button', { name: 'Update review' }),
    ).toBeVisible()
    await expect(memberPage.getByText(/group average/i)).toBeVisible()
    await expect(memberPage.getByLabel('Review (optional)')).toHaveValue(
      'Great start for the journey.',
    )

    await memberContext.close()
  })

  test('owner sees the member review and removes them', async ({ browser }) => {
    const ownerContext = await browser.newContext()
    const ownerPage = await ownerContext.newPage()

    await signIn(ownerPage, owner, `/groups/${groupId}/settings`)
    await ownerPage.goto(`/groups/${groupId}/titles/${IRON_MAN_TITLE_ID}`)
    await expect(
      ownerPage.getByText('Great start for the journey.'),
    ).toBeVisible()
    await expect(ownerPage.getByText('E2E Member')).toBeVisible()

    await ownerPage.goto(`/groups/${groupId}/settings`)
    await ownerPage.getByRole('button', { name: 'Remove' }).click()
    const dialog = ownerPage.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Remove member' }).click()
    await expect(ownerPage.getByRole('button', { name: 'Remove' })).toHaveCount(
      0,
    )

    await ownerContext.close()
  })

  test('removed member loses access to the group', async ({ browser }) => {
    const memberContext = await browser.newContext()
    const memberPage = await memberContext.newPage()

    await signIn(memberPage, member, `/groups/${groupId}`)
    await expect(
      memberPage.getByRole('heading', { name: 'Group not available' }),
    ).toBeVisible()

    await memberContext.close()
  })
})

test('owner can change the current title', async ({ page }) => {
  const owner = {
    email: uniqueEmail('current-title-owner'),
    password: PASSWORD,
    displayName: 'Current Title Owner',
  }

  await signUp(page, owner)
  const groupId = await createGroup(page, { name: 'Current Title Squad' })

  await page.goto(`/groups/${groupId}/settings`)
  await page.getByLabel('Current title').selectOption(WANDA_TITLE_ID)
  await page.getByRole('button', { name: 'Save current title' }).click()

  await page.goto(`/groups/${groupId}`)
  await expect(page.getByRole('heading', { name: 'WandaVision' })).toBeVisible()
})
