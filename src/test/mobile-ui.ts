import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

type User = ReturnType<typeof userEvent.setup>

type QueryScope = {
  getByRole: typeof screen.getByRole
}

export async function openMobileNav(
  user: User,
  label: 'Public' | 'App',
): Promise<HTMLElement> {
  await user.click(screen.getByRole('button', { name: 'Open menu' }))
  const navigations = screen.getAllByRole('navigation', { name: label })
  return navigations[navigations.length - 1]!
}

export function filterDialog(): HTMLElement {
  return screen.getByRole('dialog', { name: 'Filters' })
}

export async function openWatchlistFilters(user: User): Promise<void> {
  await user.click(screen.getByRole('button', { name: /open filters/i }))
}

export async function applyWatchlistFilters(user: User): Promise<void> {
  await user.click(screen.getByRole('button', { name: /show \d+ results/i }))
}

export async function chooseSelectOption(
  user: User,
  scope: QueryScope,
  label: string | RegExp,
  optionName: string | RegExp,
): Promise<void> {
  await user.click(scope.getByRole('combobox', { name: label }))
  await user.click(await screen.findByRole('option', { name: optionName }))
}

export function expectSelectValue(
  scope: QueryScope,
  label: string | RegExp,
  displayed: string | RegExp,
): void {
  expect(scope.getByRole('combobox', { name: label })).toHaveTextContent(
    displayed,
  )
}
