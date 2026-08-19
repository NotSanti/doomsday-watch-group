import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TitleTypeChip } from '@/features/watchlist/TitleTypeChip'

describe('TitleTypeChip', () => {
  it('renders a distinct chip label for each media type', () => {
    const { rerender } = render(<TitleTypeChip mediaType="movie" />)
    expect(screen.getByText('FILM')).toBeInTheDocument()

    rerender(<TitleTypeChip mediaType="series" />)
    expect(screen.getByText('TV')).toBeInTheDocument()

    rerender(<TitleTypeChip mediaType="special" />)
    expect(screen.getByText('SPC')).toBeInTheDocument()
  })
})
