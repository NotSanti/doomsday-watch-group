import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'

/** Vercel Web Analytics + Speed Insights (production deployments only). */
export function VercelTelemetry() {
  if (!import.meta.env.PROD) {
    return null
  }

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  )
}
