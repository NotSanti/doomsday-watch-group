import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

export async function openMobileNav(
  user: ReturnType<typeof userEvent.setup>,
  label: 'Public' | 'App',
): Promise<HTMLElement> {
  await user.click(screen.getByRole('button', { name: 'Open menu' }))
  const navigations = screen.getAllByRole('navigation', { name: label })
  return navigations[navigations.length - 1]!
}

export function filterDialog(): HTMLElement {
  return screen.getByRole('dialog', { name: 'Filters' })
}

export async function openWatchlistFilters(
  user: ReturnType<typeof userEvent.setup>,
): Promise<void> {
  await user.click(screen.getByRole('button', { name: /open filters/i }))
}

export async function applyWatchlistFilters(
  user: ReturnType<typeof userEvent.setup>,
): Promise<void> {
  await user.click(screen.getByRole('button', { name: /show \d+ results/i }))
}
