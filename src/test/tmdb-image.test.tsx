import { fireEvent, screen } from '@testing-library/react'
import { TitleArtwork } from '@/features/watchlist/TitleArtwork'
import { tmdbImageUrl } from '@/lib/tmdb-image'
import { renderAt } from '@/test/render-app'

describe('tmdbImageUrl', () => {
  it('builds poster and backdrop URLs from stored TMDB paths', () => {
    expect(tmdbImageUrl('/poster.jpg')).toBe(
      'https://image.tmdb.org/t/p/w342/poster.jpg',
    )
    expect(tmdbImageUrl('/back.jpg', 'w780')).toBe(
      'https://image.tmdb.org/t/p/w780/back.jpg',
    )
  })

  it('rejects missing or malformed paths', () => {
    expect(tmdbImageUrl(null)).toBeNull()
    expect(tmdbImageUrl(undefined)).toBeNull()
    expect(tmdbImageUrl('   ')).toBeNull()
    expect(tmdbImageUrl('poster.jpg')).toBeNull()
  })
})

describe('TitleArtwork', () => {
  it('shows a designed fallback when artwork is missing', () => {
    renderAt(<TitleArtwork path={null} alt="Iron Man poster" />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('Iron Man poster')).toBeInTheDocument()
  })

  it('falls back when the image fails to load', () => {
    renderAt(<TitleArtwork path="/poster.jpg" alt="Iron Man poster" />)

    fireEvent.error(screen.getByRole('img', { name: 'Iron Man poster' }))

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('Iron Man poster')).toBeInTheDocument()
  })
})
