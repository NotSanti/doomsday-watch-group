import { useState } from 'react'
import { Button } from '@/components/ui/button'

type SpoilerCoverProps = {
  active: boolean
  children: string
}

export function SpoilerCover({ active, children }: SpoilerCoverProps) {
  const [revealed, setRevealed] = useState(false)

  if (!active || revealed) {
    return <p className="whitespace-pre-wrap text-muted">{children}</p>
  }

  return (
    <div className="rounded-md border border-border bg-surface-elevated px-3 py-3">
      <p className="text-sm text-secondary">This review contains spoilers.</p>
      <Button
        className="mt-3"
        size="sm"
        variant="secondary"
        onClick={() => {
          setRevealed(true)
        }}
      >
        Reveal review
      </Button>
    </div>
  )
}
