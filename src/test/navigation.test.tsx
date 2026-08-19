import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@/test/render-app'

describe('navigation', () => {
  it('renders the landing page heading and countdown region', async () => {
    renderApp('/')

    expect(
      await screen.findByRole('heading', {
        name: /watch together on the road to doomsday/i,
      }),
    ).toBeInTheDocument()
    expect(screen.getByText(/doomsday is coming/i)).toBeInTheDocument()
  })

  it('opens the about page from the public header', async () => {
    const user = userEvent.setup()
    renderApp('/')

    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    const mobileNav = screen.getByRole('navigation', { name: 'Public' })
    await user.click(within(mobileNav).getByRole('link', { name: 'About' }))

    expect(screen.getByRole('heading', { name: 'About' })).toBeInTheDocument()
  })

  it('exposes a hamburger menu for small-screen public navigation', async () => {
    const user = userEvent.setup()
    renderApp('/')

    const menuButton = screen.getByRole('button', { name: 'Open menu' })
    expect(menuButton).toBeInTheDocument()

    await user.click(menuButton)

    const mobileNav = screen.getByRole('navigation', { name: 'Public' })
    expect(
      within(mobileNav).getByRole('link', { name: 'About' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument()
  })

  it('renders invite, app, and group shells for nested routes', async () => {
    renderApp('/invite/abc123')
    expect(
      await screen.findByRole('heading', { name: /join a watch group/i }),
    ).toBeInTheDocument()
  })
})
