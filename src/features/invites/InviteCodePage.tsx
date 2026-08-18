import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { parseInviteToken, invitePath } from '@/features/invites/invite-link'

export function InviteCodePage() {
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <Card>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            const token = parseInviteToken(value)
            if (!token) {
              setError('Paste an invite link or code.')
              return
            }

            setError(null)
            void navigate(invitePath(token))
          }}
        >
          <CardTitle>Join a watch group</CardTitle>
          <p className="text-muted">
            Paste the invite link or code you received. No private reviews are
            shown here.
          </p>
          <div>
            <label
              className="mb-1 block text-sm text-secondary"
              htmlFor="invite-code"
            >
              Invite link or code
            </label>
            <Input
              id="invite-code"
              value={value}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => {
                setValue(event.target.value)
              }}
            />
            {error ? (
              <p className="mt-1 text-sm text-danger" role="alert">
                {error}
              </p>
            ) : null}
          </div>
          <Button className="w-full" type="submit">
            Continue
          </Button>
        </form>
      </Card>
    </main>
  )
}
