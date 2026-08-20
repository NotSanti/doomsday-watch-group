import { buildAuthActionUrl } from '../_shared/auth-action-url.ts'
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

type EdgeRuntimeGlobal = {
  waitUntil: (promise: Promise<unknown>) => void
}

function getEdgeRuntime(): EdgeRuntimeGlobal | undefined {
  return (globalThis as { EdgeRuntime?: EdgeRuntimeGlobal }).EdgeRuntime
}

function env(name: string): string {
  const value = Deno.env.get(name)?.trim().replaceAll(/^["']|["']$/g, '')
  if (!value) {
    throw new Error(`Missing edge function secret: ${name}`)
  }

  return value
}

function sendResendTemplate(input: {
  apiKey: string
  from: string
  to: string
  templateId: string
  actionUrl: string
  userName: string
}): Promise<void> {
  return fetch('https://api.resend.com/emails', {
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
  }).then(async (response) => {
    if (!response.ok) {
      const detail = await response.text()
      throw new Error(`Resend ${response.status}: ${detail}`)
    }
  })
}

function keepAlive(promise: Promise<unknown>): void {
  const edgeRuntime = getEdgeRuntime()
  if (edgeRuntime) {
    edgeRuntime.waitUntil(promise)
    return
  }

  void promise
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

    const sendPromise = sendResendTemplate({
      apiKey: env('RESEND_API_KEY'),
      from: resolveResendFromAddress(Deno.env.toObject()),
      to: user.email,
      templateId: resolveAuthEmailTemplateId(email_data.email_action_type, {
        RESEND_TEMPLATE_CONFIRM_SIGNUP: Deno.env.get(
          'RESEND_TEMPLATE_CONFIRM_SIGNUP',
        ),
        RESEND_TEMPLATE_PASSWORD_RESET: Deno.env.get(
          'RESEND_TEMPLATE_PASSWORD_RESET',
        ),
        RESEND_TEMPLATE_AUTH_ACTION: Deno.env.get('RESEND_TEMPLATE_AUTH_ACTION'),
      }),
      actionUrl,
      userName: resolveUserDisplayName(user.user_metadata),
    }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      console.error('send-auth-email Resend failed:', message)
    })

    keepAlive(sendPromise)

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
