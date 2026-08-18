import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { inviteUrl } from '@/features/invites/invite-link'
import { getClientEnv } from '@/lib/env'
import { cn } from '@/lib/utils'

type CopyInviteLinkProps = {
  token: string
  size?: 'sm' | 'md'
  className?: string
}

export function CopyInviteLink({
  token,
  size = 'md',
  className,
}: CopyInviteLinkProps) {
  const [copied, setCopied] = useState(false)
  const url = inviteUrl(getClientEnv().VITE_APP_URL, token)

  return (
    <Button
      className={cn(size === 'md' && 'w-full', className)}
      variant={size === 'sm' ? 'secondary' : 'primary'}
      size={size}
      onClick={() => {
        void navigator.clipboard.writeText(url).then(
          () => {
            setCopied(true)
            toast.success('Invite link copied')
          },
          () => {
            toast.success('Select the link to copy it')
          },
        )
      }}
    >
      {copied ? 'Copied' : 'Copy link'}
    </Button>
  )
}
