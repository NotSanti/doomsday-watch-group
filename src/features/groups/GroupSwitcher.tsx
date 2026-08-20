import { ChevronDown } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuItemIndicator,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useGroupList } from '@/features/groups/use-groups'

export function GroupSwitcher() {
  const groupsQuery = useGroupList()
  const { groupId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const groups = groupsQuery.data ?? []
  const selected = groups.find((group) => group.id === groupId)

  if (groups.length === 0) {
    return null
  }

  function goToGroup(nextId: string) {
    if (!nextId) {
      void navigate('/app')
      return
    }

    if (groupId && location.pathname.startsWith(`/groups/${groupId}`)) {
      const rest = location.pathname.slice(`/groups/${groupId}`.length)
      void navigate(`/groups/${nextId}${rest}`)
      return
    }

    void navigate(`/groups/${nextId}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          aria-label="Switch group"
          className="h-8 min-w-0 max-w-40 justify-start gap-1 px-2.5 text-xs"
        >
          <span className="truncate uppercase tracking-[0.08em]">
            {selected?.name ?? 'All'}
          </span>
          <ChevronDown className="size-3.5 shrink-0" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          onSelect={() => {
            goToGroup('')
          }}
        >
          All
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {groups.map((group) => (
          <DropdownMenuItem
            key={group.id}
            onSelect={() => {
              goToGroup(group.id)
            }}
          >
            {group.name}
            {selected?.id === group.id ? <DropdownMenuItemIndicator /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
