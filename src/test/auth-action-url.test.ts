import { buildAuthActionUrl } from '../../supabase/functions/_shared/auth-action-url.ts'
import {
  normalizeHookSecret,
  resolveAuthEmailTemplateId,
  resolveUserDisplayName,
} from '../../supabase/functions/_shared/auth-email-templates.ts'

describe('buildAuthActionUrl', () => {
  it('builds a GoTrue verify URL with encoded redirect', () => {
    const url = buildAuthActionUrl({
      siteUrl: 'https://abc.supabase.co/',
      tokenHash: 'hash123',
      emailActionType: 'signup',
      redirectTo: 'https://doomwatchparty.online/auth/callback',
    })

    expect(url).toBe(
      'https://abc.supabase.co/auth/v1/verify?token=hash123&type=signup&redirect_to=https%3A%2F%2Fdoomwatchparty.online%2Fauth%2Fcallback',
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
