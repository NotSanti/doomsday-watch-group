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
    expect(screen.getByText(/countdown/i)).toBeInTheDocument()
  })

  it('opens the about page from the public header', async () => {
    const user = userEvent.setup()
    renderApp('/')

    const publicNav = screen.getByRole('navigation', { name: 'Public' })
    await user.click(within(publicNav).getByRole('link', { name: 'About' }))

    expect(screen.getByRole('heading', { name: 'About' })).toBeInTheDocument()
  })

  it('renders invite, app, and group shells for nested routes', async () => {
    renderApp('/invite/abc123')
    expect(
      await screen.findByRole('heading', { name: /join a watch group/i }),
    ).toBeInTheDocument()
  })
})
