import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../App'

describe('App', () => {
  it('renders the product name on the boot screen', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'Doomsday Watch Group' }),
    ).toBeInTheDocument()
  })
})
