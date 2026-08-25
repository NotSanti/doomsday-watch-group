import { Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type HomeGroupButtonProps = {
  groupName: string
  active: boolean
  onToggle: () => void
}

export function HomeGroupButton({
  groupName,
  active,
  onToggle,
}: HomeGroupButtonProps) {
  return (
    <Button
      aria-label={
        active
          ? `${groupName} is your home group. Click to disable.`
          : `Set ${groupName} as home group`
      }
      aria-pressed={active}
      className="size-9 shrink-0 p-0"
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onToggle()
      }}
      size="sm"
      type="button"
      variant="ghost"
    >
      <Home
        aria-hidden="true"
        className={cn(
          'size-5',
          active && 'fill-current text-chip-gold-fg',
        )}
      />
    </Button>
  )
}
