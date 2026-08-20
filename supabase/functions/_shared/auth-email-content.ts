import type { AuthEmailActionType } from './auth-action-url.ts'

export type AuthEmailContent = {
  subject: string
  html: string
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function brandedEmail(input: {
  title: string
  greeting: string
  body: string
  ctaLabel: string
  actionUrl: string
  footnote: string
}): string {
  const actionUrl = escapeHtml(input.actionUrl)
  const title = escapeHtml(input.title)
  const greeting = escapeHtml(input.greeting)
  const body = escapeHtml(input.body)
  const ctaLabel = escapeHtml(input.ctaLabel)
  const footnote = escapeHtml(input.footnote)

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#0d1210;color:#e6ebe5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0d1210;border-collapse:collapse;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;border-collapse:collapse;background-color:#171e1a;border:1px solid #35423a;border-radius:12px;">
            <tr>
              <td style="padding:28px 32px 0 32px;">
                <p style="margin:0 0 12px 0;font-family:Segoe UI,Arial,sans-serif;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#c49a50;">Doom Watch Party</p>
                <h1 style="margin:0;font-family:Segoe UI,Arial,sans-serif;font-size:28px;line-height:1.15;letter-spacing:0.06em;text-transform:uppercase;color:#e6ebe5;">${title}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 0 32px;">
                <p style="margin:0;font-family:Segoe UI,Arial,sans-serif;font-size:16px;line-height:1.6;color:#a5afa8;">${greeting} ${body}</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:28px 32px 8px 32px;">
                <a href="${actionUrl}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:Segoe UI,Arial,sans-serif;font-size:15px;font-weight:600;color:#081009;text-decoration:none;border-radius:8px;background-color:#4d7a4d;border:1px solid #74b85a;">${ctaLabel}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 24px 32px;">
                <p style="margin:0 0 8px 0;font-family:Segoe UI,Arial,sans-serif;font-size:13px;line-height:1.5;color:#737d76;">If the button does not work, copy and paste this link into your browser:</p>
                <p style="margin:0;font-family:Segoe UI,Arial,sans-serif;font-size:12px;line-height:1.5;word-break:break-all;"><a href="${actionUrl}" style="color:#74b85a;text-decoration:underline;">${actionUrl}</a></p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px 32px;">
                <p style="margin:0 0 12px 0;font-family:Segoe UI,Arial,sans-serif;font-size:13px;line-height:1.5;color:#737d76;">${footnote}</p>
                <p style="margin:0;font-family:Segoe UI,Arial,sans-serif;font-size:11px;line-height:1.5;color:#59645e;">Unofficial fan project. Not affiliated with or endorsed by Marvel or Disney.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export function buildAuthEmailContent(input: {
  emailActionType: AuthEmailActionType
  actionUrl: string
  userName: string
}): AuthEmailContent {
  const name = input.userName.trim() || 'there'
  const greeting = `Hi ${name},`

  switch (input.emailActionType) {
    case 'signup':
      return {
        subject: 'Confirm your Doom Watch Party account',
        html: brandedEmail({
          title: 'Confirm your email',
          greeting,
          body: 'thanks for signing up. Confirm your email address to finish creating your account.',
          ctaLabel: 'Confirm email address',
          actionUrl: input.actionUrl,
          footnote:
            'If you did not create this account, you can ignore this email.',
        }),
      }
    case 'recovery':
      return {
        subject: 'Reset your Doom Watch Party password',
        html: brandedEmail({
          title: 'Reset your password',
          greeting,
          body: 'we received a request to reset the password for your account. Use the button below to choose a new password.',
          ctaLabel: 'Reset password',
          actionUrl: input.actionUrl,
          footnote:
            'If you did not request a password reset, you can ignore this email. The link expires after a short time for security.',
        }),
      }
    default:
      return {
        subject: 'Doom Watch Party sign-in link',
        html: brandedEmail({
          title: 'Continue signing in',
          greeting,
          body: 'use the button below to continue. This link expires shortly and can only be used once.',
          ctaLabel: 'Continue',
          actionUrl: input.actionUrl,
          footnote: 'If you did not request this email, you can ignore it.',
        }),
      }
  }
}
