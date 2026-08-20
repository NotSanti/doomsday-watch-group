import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { Button } from '@/components/ui/button'
import {
  parseEmailOtpType,
  verifyEmailOtp,
} from '@/features/auth/auth-api'
import { useAuth } from '@/features/auth/use-auth'
import { safeReturnTo } from '@/lib/return-to'
import { getSupabaseClient } from '@/lib/supabase'

type OtpPhase = 'idle' | 'verifying' | 'success' | 'error'

export function AuthCallbackPage() {
  const { status, isPasswordRecovery } = useAuth()
  const [searchParams] = useSearchParams()
  const tokenHash = searchParams.get('token_hash')
  const otpType = parseEmailOtpType(searchParams.get('type'))
  const needsOtpExchange = Boolean(tokenHash && otpType)
  const verifyStarted = useRef(false)
  const [otpPhase, setOtpPhase] = useState<OtpPhase>(
    needsOtpExchange ? 'verifying' : 'idle',
  )
  const [otpError, setOtpError] = useState<string | null>(null)

  useEffect(() => {
    if (!tokenHash || !otpType || verifyStarted.current) {
      return
    }

    // OTP links are single-use; guard against React Strict Mode double-invoke.
    verifyStarted.current = true
    setOtpPhase('verifying')

    void verifyEmailOtp(getSupabaseClient(), {
      tokenHash,
      type: otpType,
    }).then(({ data, error }) => {
      if (error || !data.session) {
        setOtpError(
          'This sign-in link is invalid or has expired. Request a new one from the sign-in page.',
        )
        setOtpPhase('error')
        return
      }

      setOtpPhase('success')
    })
  }, [otpType, tokenHash])

  const fallback = isPasswordRecovery ? '/auth?mode=update-password' : '/app'
  const next = safeReturnTo(searchParams.get('next'), fallback)

  if (
    otpPhase === 'verifying' ||
    status === 'loading' ||
    (otpPhase === 'success' && status !== 'authenticated')
  ) {
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

  if (otpPhase === 'error' || (otpPhase === 'idle' && status === 'anonymous')) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <ErrorState
          title="Link expired"
          message={
            otpError ??
            'This sign-in link is invalid or has expired. Request a new one from the sign-in page.'
          }
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
