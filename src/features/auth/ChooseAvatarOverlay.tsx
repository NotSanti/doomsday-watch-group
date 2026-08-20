import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { updateAvatarIcon } from '@/features/auth/auth-api'
import { toFriendlyAuthError } from '@/features/auth/auth-errors'
import { ProfileIconPicker } from '@/features/auth/ProfileIconPicker'
import type { ProfileIconId } from '@/features/auth/profile-icons'
import { useAuth } from '@/features/auth/use-auth'
import { getSupabaseClient } from '@/lib/supabase'

export function ChooseAvatarOverlay() {
  const { user, refreshProfile } = useAuth()
  const [selected, setSelected] = useState<ProfileIconId | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  if (!user) {
    return null
  }

  return (
    <Dialog open>
      <DialogContent
        title="Last step"
        description="Choose a profile icon. You can change it later from your profile."
        preventDismiss
        className="w-[min(40rem,calc(100%-2rem))]"
      >
        {formError ? (
          <p
            className="mb-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-heading"
            role="alert"
          >
            {formError}
          </p>
        ) : null}
        <ProfileIconPicker
          value={selected}
          onChange={setSelected}
          disabled={saving}
        />
        <Button
          className="mt-6 w-full"
          type="button"
          disabled={saving || !selected}
          onClick={() => {
            if (!selected) {
              return
            }

            setFormError(null)
            setSaving(true)
            void updateAvatarIcon(getSupabaseClient(), user.id, selected)
              .then(async () => {
                await refreshProfile()
                toast.success('Profile icon saved')
              })
              .catch((error: unknown) => {
                setFormError(toFriendlyAuthError(error))
              })
              .finally(() => {
                setSaving(false)
              })
          }}
        >
          {saving ? 'Saving…' : 'Save icon'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
