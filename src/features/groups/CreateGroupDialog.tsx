import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { CreateGroupForm } from '@/features/groups/CreateGroupForm'

type CreateGroupDialogProps = {
  trigger?: ReactNode
}

export function CreateGroupDialog({ trigger }: CreateGroupDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button>Create group</Button>}
      </DialogTrigger>
      <DialogContent title="Create a watch group">
        <CreateGroupForm />
      </DialogContent>
    </Dialog>
  )
}
