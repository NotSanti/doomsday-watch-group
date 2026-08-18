import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  requestPasswordReset,
  signInWithPassword,
  signUpWithPassword,
  updatePassword,
} from '@/features/auth/auth-api'
import { toFriendlyAuthError } from '@/features/auth/auth-errors'
import {
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
  type ResetPasswordValues,
  type SignInValues,
  type SignUpValues,
  type UpdatePasswordValues,
} from '@/features/auth/auth-schemas'
import { useAuth } from '@/features/auth/use-auth'
import { safeReturnTo } from '@/lib/return-to'
import { getSupabaseClient } from '@/lib/supabase'

type AuthMode = 'signin' | 'signup' | 'reset' | 'update-password'

function parseMode(
  value: string | null,
  isPasswordRecovery: boolean,
): AuthMode {
  if (isPasswordRecovery || value === 'update-password') {
    return 'update-password'
  }

  if (value === 'signup' || value === 'reset') {
    return value
  }

  return 'signin'
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return (
    <p className="mt-1 text-sm text-danger" role="alert">
      {message}
    </p>
  )
}

function FormAlert({ message }: { message: string | null }) {
  if (!message) {
    return null
  }

  return (
    <p
      className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-heading"
      role="alert"
    >
      {message}
    </p>
  )
}

export function AuthPage() {
  const { status, isPasswordRecovery } = useAuth()
  const [searchParams] = useSearchParams()
  const returnTo = safeReturnTo(searchParams.get('returnTo'))
  const mode = parseMode(searchParams.get('mode'), isPasswordRecovery)

  if (status === 'authenticated' && mode !== 'update-password') {
    return <Navigate to={returnTo} replace />
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <Card className="space-y-6">
        {mode === 'signin' ? <SignInForm returnTo={returnTo} /> : null}
        {mode === 'signup' ? <SignUpForm returnTo={returnTo} /> : null}
        {mode === 'reset' ? <ResetPasswordForm /> : null}
        {mode === 'update-password' ? <UpdatePasswordForm /> : null}
      </Card>
    </main>
  )
}

function SignInForm({ returnTo }: { returnTo: string }) {
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  })

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        setFormError(null)
        const { error } = await signInWithPassword(getSupabaseClient(), values)

        if (error) {
          setFormError(toFriendlyAuthError(error))
          return
        }

        toast.success('Signed in')
      })}
    >
      <div>
        <h1 className="font-display text-3xl tracking-[0.08em] text-heading uppercase">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-muted">
          Use the email and password for your watch group account.
        </p>
      </div>
      <FormAlert message={formError} />
      <div>
        <label
          className="mb-1 block text-sm text-secondary"
          htmlFor="signin-email"
        >
          Email
        </label>
        <Input
          id="signin-email"
          type="email"
          autoComplete="email"
          {...form.register('email')}
        />
        <FieldError message={form.formState.errors.email?.message} />
      </div>
      <div>
        <label
          className="mb-1 block text-sm text-secondary"
          htmlFor="signin-password"
        >
          Password
        </label>
        <Input
          id="signin-password"
          type="password"
          autoComplete="current-password"
          {...form.register('password')}
        />
        <FieldError message={form.formState.errors.password?.message} />
      </div>
      <Button
        className="w-full"
        type="submit"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>
      <p className="text-sm text-muted">
        <Link
          className="text-primary-emphasis hover:text-heading"
          to="/auth?mode=reset"
        >
          Forgot password?
        </Link>
      </p>
      <p className="text-sm text-muted">
        New here?{' '}
        <Link
          className="text-primary-emphasis hover:text-heading"
          to={`/auth?mode=signup&returnTo=${encodeURIComponent(returnTo)}`}
        >
          Create an account
        </Link>
      </p>
    </form>
  )
}

function SignUpForm({ returnTo }: { returnTo: string }) {
  const [formError, setFormError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', displayName: '' },
  })

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        setFormError(null)
        setInfo(null)
        const { data, error } = await signUpWithPassword(
          getSupabaseClient(),
          values,
        )

        if (error) {
          setFormError(toFriendlyAuthError(error))
          return
        }

        if (!data.session) {
          setInfo('Check your inbox to confirm your email before signing in.')
          return
        }

        toast.success('Account created')
      })}
    >
      <div>
        <h1 className="font-display text-3xl tracking-[0.08em] text-heading uppercase">
          Create account
        </h1>
        <p className="mt-2 text-sm text-muted">
          Email sign-up only. Your display name is how group members will see
          you.
        </p>
      </div>
      <FormAlert message={formError} />
      {info ? (
        <p
          className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-heading"
          role="status"
        >
          {info}
        </p>
      ) : null}
      <div>
        <label
          className="mb-1 block text-sm text-secondary"
          htmlFor="signup-name"
        >
          Display name
        </label>
        <Input
          id="signup-name"
          autoComplete="nickname"
          {...form.register('displayName')}
        />
        <FieldError message={form.formState.errors.displayName?.message} />
      </div>
      <div>
        <label
          className="mb-1 block text-sm text-secondary"
          htmlFor="signup-email"
        >
          Email
        </label>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          {...form.register('email')}
        />
        <FieldError message={form.formState.errors.email?.message} />
      </div>
      <div>
        <label
          className="mb-1 block text-sm text-secondary"
          htmlFor="signup-password"
        >
          Password
        </label>
        <Input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          {...form.register('password')}
        />
        <FieldError message={form.formState.errors.password?.message} />
      </div>
      <Button
        className="w-full"
        type="submit"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? 'Creating account…' : 'Create account'}
      </Button>
      <p className="text-sm text-muted">
        Already have an account?{' '}
        <Link
          className="text-primary-emphasis hover:text-heading"
          to={`/auth?returnTo=${encodeURIComponent(returnTo)}`}
        >
          Sign in
        </Link>
      </p>
    </form>
  )
}

function ResetPasswordForm() {
  const [formError, setFormError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: '' },
  })

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        setFormError(null)
        const { error } = await requestPasswordReset(
          getSupabaseClient(),
          values.email,
        )

        if (error) {
          setFormError(toFriendlyAuthError(error))
          return
        }

        setInfo('If that email is registered, a reset link is on the way.')
      })}
    >
      <div>
        <h1 className="font-display text-3xl tracking-[0.08em] text-heading uppercase">
          Reset password
        </h1>
        <p className="mt-2 text-sm text-muted">
          We’ll send a reset link if an account exists for that email.
        </p>
      </div>
      <FormAlert message={formError} />
      {info ? (
        <p
          className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-heading"
          role="status"
        >
          {info}
        </p>
      ) : null}
      <div>
        <label
          className="mb-1 block text-sm text-secondary"
          htmlFor="reset-email"
        >
          Email
        </label>
        <Input
          id="reset-email"
          type="email"
          autoComplete="email"
          {...form.register('email')}
        />
        <FieldError message={form.formState.errors.email?.message} />
      </div>
      <Button
        className="w-full"
        type="submit"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? 'Sending…' : 'Send reset link'}
      </Button>
      <p className="text-sm text-muted">
        <Link className="text-primary-emphasis hover:text-heading" to="/auth">
          Back to sign in
        </Link>
      </p>
      <p className="text-xs text-muted">
        Local development captures reset emails in Mailpit instead of sending
        them.
      </p>
    </form>
  )
}

function UpdatePasswordForm() {
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<UpdatePasswordValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        setFormError(null)
        const { error } = await updatePassword(
          getSupabaseClient(),
          values.password,
        )

        if (error) {
          setFormError(toFriendlyAuthError(error))
          return
        }

        toast.success('Password updated')
        navigate('/app', { replace: true })
      })}
    >
      <div>
        <h1 className="font-display text-3xl tracking-[0.08em] text-heading uppercase">
          Set a new password
        </h1>
        <p className="mt-2 text-sm text-muted">
          Choose a new password for this account.
        </p>
      </div>
      <FormAlert message={formError} />
      <div>
        <label
          className="mb-1 block text-sm text-secondary"
          htmlFor="update-password"
        >
          New password
        </label>
        <Input
          id="update-password"
          type="password"
          autoComplete="new-password"
          {...form.register('password')}
        />
        <FieldError message={form.formState.errors.password?.message} />
      </div>
      <div>
        <label
          className="mb-1 block text-sm text-secondary"
          htmlFor="update-password-confirm"
        >
          Confirm password
        </label>
        <Input
          id="update-password-confirm"
          type="password"
          autoComplete="new-password"
          {...form.register('confirmPassword')}
        />
        <FieldError message={form.formState.errors.confirmPassword?.message} />
      </div>
      <Button
        className="w-full"
        type="submit"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? 'Saving…' : 'Save password'}
      </Button>
    </form>
  )
}
