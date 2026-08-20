import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { parseEmailOtpType } from '@/features/auth/auth-api'

/**
 * If an auth email lands on Site URL `/` with token_hash, forward to the
 * callback route that performs verifyOtp.
 */
export function useAuthEmailTokenRedirect() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (location.pathname !== '/') {
      return
    }

    const params = new URLSearchParams(location.search)
    const tokenHash = params.get('token_hash')
    const type = parseEmailOtpType(params.get('type'))

    if (!tokenHash || !type) {
      return
    }

    navigate(`/auth/callback?${params.toString()}`, { replace: true })
  }, [location.pathname, location.search, navigate])
}
