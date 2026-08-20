import {
  PRODUCTION_APP_URL_ERROR,
  applyViteAppUrl,
  resolveViteAppUrl,
} from '@/lib/resolve-app-url'

describe('resolveViteAppUrl', () => {
  it('prefers an explicit public origin and strips a trailing slash', () => {
    expect(
      resolveViteAppUrl({
        VITE_APP_URL: 'https://doomwatchparty.vercel.app/',
        VERCEL_URL: 'doomwatchparty-git-preview-notsanti.vercel.app',
        VERCEL_ENV: 'preview',
      }),
    ).toBe('https://doomwatchparty.vercel.app')
  })

  it('derives HTTPS preview origins from VERCEL_URL', () => {
    expect(
      resolveViteAppUrl({
        VERCEL_URL: 'doomwatchparty-abc123-notsanti.vercel.app',
        VERCEL_ENV: 'preview',
      }),
    ).toBe('https://doomwatchparty-abc123-notsanti.vercel.app')
  })

  it('refuses production builds without a canonical origin', () => {
    expect(() =>
      resolveViteAppUrl({
        VERCEL_ENV: 'production',
        VERCEL_URL: 'doomwatchparty-xyz.vercel.app',
      }),
    ).toThrow(PRODUCTION_APP_URL_ERROR)
  })

  it('writes the resolved origin back onto the env object', () => {
    const env: Record<string, string | undefined> = {
      VERCEL_ENV: 'preview',
      VERCEL_URL: 'example-preview.vercel.app',
    }

    applyViteAppUrl(env)

    expect(env.VITE_APP_URL).toBe('https://example-preview.vercel.app')
  })
})
