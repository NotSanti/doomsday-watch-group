import { Link, Navigate, useSearchParams } from 'react-router'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/use-auth'
import { safeReturnTo } from '@/lib/return-to'

export function AuthCallbackPage() {
  const { status, isPasswordRecovery } = useAuth()
  const [searchParams] = useSearchParams()
  const fallback = isPasswordRecovery ? '/auth?mode=update-password' : '/app'
  const next = safeReturnTo(searchParams.get('next'), fallback)

  if (status === 'loading') {
    return (
      <main
        className="mx-auto max-w-md px-4 py-16"
        role="status"
        aria-live="polite"
      >
        <span className="sr-only">Finishing sign-in</span>
        <Skeleton className="h-10 w-40" />
        <Skeleton className="mt-4 h-24 w-full" />
      </main>
    )
  }

  if (status === 'anonymous') {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <ErrorState
          title="Link expired"
          message="This sign-in link is invalid or has expired. Request a new one from the sign-in page."
        />
        <div className="mt-6 text-center">
          <Button asChild>
            <Link to="/auth">Back to sign in</Link>
          </Button>
        </div>
      </main>
    )
  }

  return <Navigate to={next} replace />
}
