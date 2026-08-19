import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Countdown } from '@/components/Countdown'

describe('Countdown', () => {
  it('shows elapsed copy when the target is in the past', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2027-01-01T00:00:00.000Z'))

    render(<Countdown targetIso="2026-12-18T00:00:00.000Z" />)

    expect(screen.getByText(/the date has arrived/i)).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('renders a zero-padded MM:DD:hh:mm:ss clock', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 18, 12, 0, 0))

    render(
      <Countdown targetIso={new Date(2026, 11, 18, 12, 0, 0).toISOString()} />,
    )

    expect(screen.getByRole('timer')).toHaveAttribute(
      'aria-label',
      '04:00:00:00:00',
    )
    expect(screen.getByText('Month')).toBeInTheDocument()
    expect(screen.getByText('Day')).toBeInTheDocument()
    expect(screen.getAllByText('04').length).toBeGreaterThan(0)
    vi.useRealTimers()
  })
})
