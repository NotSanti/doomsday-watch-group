import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { updateDisplayName } from '@/features/auth/auth-api'
import { toFriendlyAuthError } from '@/features/auth/auth-errors'
import {
  needsDisplayNameOnboarding,
  profileSchema,
  type ProfileFormValues,
} from '@/features/auth/auth-schemas'
import { useAuth } from '@/features/auth/use-auth'
import { getSupabaseClient } from '@/lib/supabase'
import { safeReturnTo } from '@/lib/return-to'

export function ProfilePage() {
  const { user, profile, needsOnboarding, refreshProfile, signOut } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const onboarding = searchParams.get('onboarding') === '1' || needsOnboarding
  const returnTo = safeReturnTo(searchParams.get('returnTo'))

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: '' },
  })

  useEffect(() => {
    if (!profile) {
      return
    }

    form.reset({
      displayName: needsDisplayNameOnboarding(profile.display_name)
        ? ''
        : profile.display_name,
    })
  }, [form, profile])

  if (!user) {
    return null
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            setFormError(null)
            try {
              await updateDisplayName(
                getSupabaseClient(),
                user.id,
                values.displayName,
              )
              await refreshProfile()
              toast.success('Display name saved')
              if (onboarding) {
                navigate(returnTo, { replace: true })
              }
            } catch (error) {
              setFormError(toFriendlyAuthError(error))
            }
          })}
        >
          <div>
            <h1 className="font-display text-3xl tracking-[0.08em] text-heading uppercase">
              {onboarding ? 'Choose a display name' : 'Profile'}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {onboarding
                ? 'Group members will see this name. You can change it later.'
                : 'Update how you appear to people in your watch groups.'}
            </p>
          </div>
          {formError ? (
            <p
              className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-heading"
              role="alert"
            >
              {formError}
            </p>
          ) : null}
          <div>
            <p className="text-sm text-secondary">Email</p>
            <p className="mt-1 text-heading">{user.email ?? 'Signed in'}</p>
          </div>
          <div>
            <label
              className="mb-1 block text-sm text-secondary"
              htmlFor="display-name"
            >
              Display name
            </label>
            <Input
              id="display-name"
              autoComplete="nickname"
              {...form.register('displayName')}
            />
            {form.formState.errors.displayName ? (
              <p className="mt-1 text-sm text-danger" role="alert">
                {form.formState.errors.displayName.message}
              </p>
            ) : null}
          </div>
          <Button
            className="w-full"
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Saving…' : 'Save display name'}
          </Button>
        </form>
        <div className="mt-6 border-t border-border pt-4">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              void signOut()
            }}
          >
            Sign out
          </Button>
        </div>
      </Card>
    </div>
  )
}
