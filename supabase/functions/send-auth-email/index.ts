import { buildAuthActionUrl } from '../_shared/auth-action-url.ts'
import { buildAuthEmailContent } from '../_shared/auth-email-content.ts'
import {
  isSupportedAuthEmailAction,
  normalizeHookSecret,
  resolveAuthEmailTemplateId,
  resolveResendFromAddress,
  resolveUserDisplayName,
} from '../_shared/auth-email-templates.ts'
import { verifyStandardWebhookPayload } from '../_shared/auth-webhook.ts'

type SendEmailHookPayload = {
  user: {
    email: string
    user_metadata?: Record<string, unknown>
  }
  email_data: {
    token: string
    token_hash: string
    redirect_to: string
    email_action_type: string
    site_url: string
    token_new: string
    token_hash_new: string
  }
}

function env(name: string): string {
  const value = Deno.env.get(name)?.trim().replaceAll(/^["']|["']$/g, '')
  if (!value) {
    throw new Error(`Missing edge function secret: ${name}`)
  }

  return value
}

function optionalEnv(name: string): string | undefined {
  const value = Deno.env.get(name)?.trim().replaceAll(/^["']|["']$/g, '')
  return value && value.length > 0 ? value : undefined
}

async function sendResendHtml(input: {
  apiKey: string
  from: string
  to: string
  subject: string
  html: string
}): Promise<void> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: input.from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
    }),
    signal: AbortSignal.timeout(8_000),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Resend ${response.status}: ${detail}`)
  }
}

async function sendResendTemplate(input: {
  apiKey: string
  from: string
  to: string
  templateId: string
  actionUrl: string
  userName: string
}): Promise<'sent' | 'missing_template'> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: input.from,
      to: [input.to],
      template: {
        id: input.templateId,
        variables: {
          ACTION_URL: input.actionUrl,
          USER_NAME: input.userName,
        },
      },
    }),
    signal: AbortSignal.timeout(8_000),
  })

  if (response.ok) {
    return 'sent'
  }

  const detail = await response.text()
  if (response.status === 404 || detail.includes('Template not found')) {
    return 'missing_template'
  }

  throw new Error(`Resend ${response.status}: ${detail}`)
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  try {
    const payload = await req.text()
    const headers = Object.fromEntries(req.headers)
    const verified = (await verifyStandardWebhookPayload(
      payload,
      headers,
      normalizeHookSecret(env('SEND_EMAIL_HOOK_SECRET')),
    )) as SendEmailHookPayload

    const { user, email_data } = verified

    if (!isSupportedAuthEmailAction(email_data.email_action_type)) {
      throw new Error(
        `Unsupported auth email action: ${email_data.email_action_type}`,
      )
    }

    const actionUrl = buildAuthActionUrl({
      siteUrl: email_data.site_url,
      tokenHash: email_data.token_hash,
      emailActionType: email_data.email_action_type,
      redirectTo: email_data.redirect_to,
    })
    const userName = resolveUserDisplayName(user.user_metadata)
    const apiKey = env('RESEND_API_KEY')
    const from = resolveResendFromAddress(Deno.env.toObject())
    const content = buildAuthEmailContent({
      emailActionType: email_data.email_action_type,
      actionUrl,
      userName,
    })

    const templateEnv = {
      RESEND_TEMPLATE_CONFIRM_SIGNUP: optionalEnv(
        'RESEND_TEMPLATE_CONFIRM_SIGNUP',
      ),
      RESEND_TEMPLATE_PASSWORD_RESET: optionalEnv(
        'RESEND_TEMPLATE_PASSWORD_RESET',
      ),
      RESEND_TEMPLATE_AUTH_ACTION: optionalEnv('RESEND_TEMPLATE_AUTH_ACTION'),
    }

    let sentViaTemplate = false
    try {
      const templateId = resolveAuthEmailTemplateId(
        email_data.email_action_type,
        templateEnv,
      )
      const templateResult = await sendResendTemplate({
        apiKey,
        from,
        to: user.email,
        templateId,
        actionUrl,
        userName,
      })
      sentViaTemplate = templateResult === 'sent'
      if (templateResult === 'missing_template') {
        console.warn(
          `send-auth-email template missing (${templateId}); falling back to HTML for ${email_data.email_action_type}`,
        )
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes('Missing edge function secret: RESEND_TEMPLATE_')) {
        console.warn(
          `send-auth-email template secret missing; falling back to HTML for ${email_data.email_action_type}`,
        )
      } else {
        throw error
      }
    }

    if (!sentViaTemplate) {
      await sendResendHtml({
        apiKey,
        from,
        to: user.email,
        subject: content.subject,
        html: content.html,
      })
    }

    return Response.json({}, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Hook failed'
    console.error('send-auth-email failed:', message)

    return Response.json(
      {
        error: {
          http_code: 400,
          message,
        },
      },
      { status: 400 },
    )
  }
})
