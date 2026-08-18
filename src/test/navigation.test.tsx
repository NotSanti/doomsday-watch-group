import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from '@/app/router'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  )
}

describe('navigation', () => {
  it('renders the landing page heading and countdown region', () => {
    renderAt('/')

    expect(
      screen.getByRole('heading', {
        name: /watch together on the road to doomsday/i,
      }),
    ).toBeInTheDocument()
    expect(screen.getByText(/countdown/i)).toBeInTheDocument()
  })

  it('opens the about page from the public header', async () => {
    const user = userEvent.setup()
    renderAt('/')

    const publicNav = screen.getByRole('navigation', { name: 'Public' })
    await user.click(within(publicNav).getByRole('link', { name: 'About' }))

    expect(screen.getByRole('heading', { name: 'About' })).toBeInTheDocument()
  })

  it('renders invite, app, and group shells for nested routes', () => {
    renderAt('/invite/abc123')
    expect(
      screen.getByRole('heading', { name: /join a watch group/i }),
    ).toBeInTheDocument()
  })

  it('renders the protected app shell for a group dashboard', () => {
    renderAt('/groups/demo')

    expect(
      screen.getByRole('heading', { name: /group dashboard/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'App' })).toBeInTheDocument()
  })
})
