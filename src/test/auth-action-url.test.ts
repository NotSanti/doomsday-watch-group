import { buildAuthActionUrl } from '../../supabase/functions/_shared/auth-action-url.ts'
import {
  normalizeHookSecret,
  normalizeResendFromAddress,
  parseResendFromAddress,
  resolveAuthEmailTemplateId,
  resolveResendFromAddress,
  resolveUserDisplayName,
} from '../../supabase/functions/_shared/auth-email-templates.ts'

describe('buildAuthActionUrl', () => {
  it('builds an SPA callback URL with token_hash for verifyOtp', () => {
    const url = buildAuthActionUrl({
      siteUrl: 'https://abc.supabase.co/',
      tokenHash: 'hash123',
      emailActionType: 'signup',
      redirectTo: 'https://doomwatchparty.online/auth/callback',
    })

    expect(url).toBe(
      'https://doomwatchparty.online/auth/callback?token_hash=hash123&type=signup',
    )
  })

  it('preserves existing redirect query params such as next', () => {
    const url = buildAuthActionUrl({
      tokenHash: 'hash456',
      emailActionType: 'recovery',
      redirectTo:
        'https://doomwatchparty.online/auth/callback?next=%2Fauth%3Fmode%3Dupdate-password',
    })

    expect(url).toBe(
      'https://doomwatchparty.online/auth/callback?next=%2Fauth%3Fmode%3Dupdate-password&token_hash=hash456&type=recovery',
    )
  })
})

describe('resolveAuthEmailTemplateId', () => {
  const env = {
    RESEND_TEMPLATE_CONFIRM_SIGNUP: 'tmpl_confirm',
    RESEND_TEMPLATE_PASSWORD_RESET: 'tmpl_reset',
    RESEND_TEMPLATE_AUTH_ACTION: 'tmpl_action',
  }

  it('maps signup and recovery to dedicated templates', () => {
    expect(resolveAuthEmailTemplateId('signup', env)).toBe('tmpl_confirm')
    expect(resolveAuthEmailTemplateId('recovery', env)).toBe('tmpl_reset')
  })

  it('falls back to the generic auth action template', () => {
    expect(resolveAuthEmailTemplateId('magiclink', env)).toBe('tmpl_action')
  })
})

describe('normalizeHookSecret', () => {
  it('strips quotes and the GoTrue secret prefix', () => {
    expect(normalizeHookSecret('  "v1,whsec_abc123="  ')).toBe('abc123=')
    expect(normalizeHookSecret('abc123=')).toBe('abc123=')
  })
})

describe('normalizeResendFromAddress', () => {
  it('removes literal quotes around the display name', () => {
    expect(
      normalizeResendFromAddress(
        '"Doom Watch Party" <noreply@doomwatchparty.online>',
      ),
    ).toBe('Doom Watch Party <noreply@doomwatchparty.online>')
    expect(
      normalizeResendFromAddress(
        '"Doom Watch Party <noreply@doomwatchparty.online>"',
      ),
    ).toBe('Doom Watch Party <noreply@doomwatchparty.online>')
  })
})

describe('resolveResendFromAddress', () => {
  it('builds from split name and address secrets', () => {
    expect(
      resolveResendFromAddress({
        RESEND_FROM_NAME: 'Doom Watch Party',
        RESEND_FROM_ADDRESS: 'noreply@doomwatchparty.online',
      }),
    ).toBe('Doom Watch Party <noreply@doomwatchparty.online>')
  })

  it('falls back to combined RESEND_FROM_EMAIL', () => {
    expect(
      resolveResendFromAddress({
        RESEND_FROM_EMAIL: 'Doom Watch Party <noreply@doomwatchparty.online>',
      }),
    ).toBe('Doom Watch Party <noreply@doomwatchparty.online>')
  })
})

describe('parseResendFromAddress', () => {
  it('returns email-only when no display name is provided', () => {
    expect(parseResendFromAddress('noreply@doomwatchparty.online')).toEqual({
      email: 'noreply@doomwatchparty.online',
    })
  })
})

import { verifyStandardWebhookPayload } from '../../supabase/functions/_shared/auth-webhook.ts'

describe('resolveUserDisplayName', () => {
  it('uses display_name metadata when present', () => {
    expect(
      resolveUserDisplayName({ display_name: '  Wanda  ' }),
    ).toBe('Wanda')
  })

  it('falls back to there', () => {
    expect(resolveUserDisplayName({})).toBe('there')
    expect(resolveUserDisplayName(undefined)).toBe('there')
  })
})

describe('verifyStandardWebhookPayload', () => {
  it('accepts a valid Standard Webhooks signature', async () => {
    const secretBytes = new Uint8Array(32).map((_, index) => index + 1)
    let binary = ''
    for (const byte of secretBytes) {
      binary += String.fromCharCode(byte)
    }
    const secret = btoa(binary)
    const payload = JSON.stringify({ ok: true })
    const id = 'msg_1'
    const timestamp = '1710000000'
    const key = await crypto.subtle.importKey(
      'raw',
      secretBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const signed = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(`${id}.${timestamp}.${payload}`),
    )
    const signature = btoa(String.fromCharCode(...new Uint8Array(signed)))

    await expect(
      verifyStandardWebhookPayload(
        payload,
        {
          'webhook-id': id,
          'webhook-timestamp': timestamp,
          'webhook-signature': `v1,${signature}`,
        },
        secret,
      ),
    ).resolves.toEqual({ ok: true })
  })
})
