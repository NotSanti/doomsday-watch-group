import { readFileSync } from 'node:fs'

type VercelRewrite = {
  source: string
  destination: string
}

describe('Vercel SPA configuration', () => {
  const raw = readFileSync('vercel.json', 'utf8')
  const config = JSON.parse(raw) as {
    rewrites?: VercelRewrite[]
    headers?: { source: string; headers: { key: string; value: string }[] }[]
  }

  it('rewrites nested client routes to the Vite entry', () => {
    expect(config.rewrites).toEqual(
      expect.arrayContaining([
        {
          source: '/(.*)',
          destination: '/index.html',
        },
      ]),
    )
  })

  it('does not store secrets in vercel.json', () => {
    expect(raw).not.toMatch(/service.role|sb_secret_|TMDB_API_READ_TOKEN/i)
    expect(raw).not.toMatch(/VITE_SUPABASE_PUBLISHABLE_KEY/)
  })

  it('sets basic browser isolation headers', () => {
    const globalHeaders = config.headers?.find(
      (entry) => entry.source === '/(.*)',
    )?.headers

    expect(globalHeaders).toEqual(
      expect.arrayContaining([
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
      ]),
    )
  })
})
