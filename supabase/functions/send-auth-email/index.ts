import { Webhook } from 'npm:standardwebhooks@^1'
import { Resend } from 'npm:resend@^6'

import { buildAuthActionUrl } from '../_shared/auth-action-url.ts'
import {
  isSupportedAuthEmailAction,
  resolveAuthEmailTemplateId,
  resolveUserDisplayName,
} from '../_shared/auth-email-templates.ts'

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

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
const hookSecret = (Deno.env.get('SEND_EMAIL_HOOK_SECRET') ?? '').replace(
  'v1,whsec_',
  '',
)
const fromAddress = Deno.env.get('RESEND_FROM_EMAIL')

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  if (!fromAddress) {
    return Response.json(
      { error: { message: 'Missing RESEND_FROM_EMAIL secret' } },
      { status: 500 },
    )
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)
  const webhook = new Webhook(hookSecret)

  try {
    const { user, email_data } = webhook.verify(
      payload,
      headers,
    ) as SendEmailHookPayload

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

    const templateId = resolveAuthEmailTemplateId(
      email_data.email_action_type,
      Deno.env.toObject(),
    )

    const { error } = await resend.emails.send({
      from: fromAddress,
      to: [user.email],
      template: {
        id: templateId,
        variables: {
          ACTION_URL: actionUrl,
          USER_NAME: resolveUserDisplayName(user.user_metadata),
        },
      },
    })

    if (error) {
      throw error
    }

    return Response.json({}, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized'
    const httpCode =
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      typeof error.statusCode === 'number'
        ? error.statusCode
        : 401

    console.error('send-auth-email failed:', message)

    return Response.json(
      {
        error: {
          http_code: httpCode,
          message,
        },
      },
      { status: httpCode >= 400 && httpCode < 600 ? httpCode : 401 },
    )
  }
})
