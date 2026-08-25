import { render, screen } from '@testing-library/react'
import { Dialog, DialogContent } from '@/components/ui/dialog'

describe('DialogContent', () => {
  it('uses a fullscreen mobile sheet and a centered desktop card', () => {
    render(
      <Dialog open>
        <DialogContent title="Example popup">Body</DialogContent>
      </Dialog>,
    )

    const dialog = screen.getByRole('dialog')
    expect(dialog.className).toMatch(/inset-0/)
    expect(dialog.className).toMatch(/h-dvh/)
    expect(dialog.className).toMatch(/bg-surface-elevated\/70/)
    expect(dialog.className).toMatch(/backdrop-blur-2xl/)
    expect(dialog.className).toMatch(/md:top-1\/2/)
    expect(dialog.className).toMatch(/md:rounded-xl/)
  })

  it('shows a mobile-only close control', () => {
    render(
      <Dialog open>
        <DialogContent title="Example popup">Body</DialogContent>
      </Dialog>,
    )

    const close = screen.getByRole('button', { name: 'Close' })
    expect(close.className).toMatch(/md:hidden/)
  })

  it('hides the close control when dismiss is prevented', () => {
    render(
      <Dialog open>
        <DialogContent title="Required step" preventDismiss>
          Body
        </DialogContent>
      </Dialog>,
    )

    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
  })
})
