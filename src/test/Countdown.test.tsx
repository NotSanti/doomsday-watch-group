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
})
