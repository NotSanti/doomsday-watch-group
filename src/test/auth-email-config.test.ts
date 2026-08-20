import { readFileSync } from 'node:fs'

describe('Resend auth email configuration', () => {
  const envExample = readFileSync('.env.example', 'utf8')
  const supabaseConfig = readFileSync('supabase/config.toml', 'utf8')
  const clientEnv = readFileSync('src/lib/env.ts', 'utf8')
  const packageJson = readFileSync('package.json', 'utf8')
  const authEmailDocs = readFileSync('docs/auth-email.md', 'utf8')
  const confirmTemplate = readFileSync(
    'docs/email-templates/confirm-signup.html',
    'utf8',
  )

  it('documents Resend secrets without putting the key in the Vite client', () => {
    expect(envExample).toMatch(/^RESEND_API_KEY=/m)
    expect(envExample).toMatch(/^RESEND_FROM_EMAIL=/m)
    expect(envExample).toMatch(/^SEND_EMAIL_HOOK_SECRET=/m)
    expect(envExample).toMatch(/^RESEND_TEMPLATE_CONFIRM_SIGNUP=/m)
    expect(envExample).toMatch(/^RESEND_TEMPLATE_PASSWORD_RESET=/m)
    expect(envExample).not.toMatch(/VITE_RESEND/)
    expect(clientEnv).not.toMatch(/RESEND_/)
    expect(packageJson).not.toMatch(/"resend"/)
  })

  it('routes auth mail through the send-auth-email hook and edge function', () => {
    expect(supabaseConfig).toMatch(/\[functions\.send-auth-email\]/)
    expect(supabaseConfig).toMatch(/verify_jwt = false/)
    expect(supabaseConfig).toMatch(/\[auth\.hook\.send_email\]/)
    expect(supabaseConfig).toMatch(/send-auth-email/)
    expect(authEmailDocs).toMatch(/send-auth-email/)
    expect(authEmailDocs).toMatch(/falls back to branded HTML/)
  })

  it('uses Resend triple-brace variables in templates', () => {
    expect(confirmTemplate).toMatch(/\{\{\{ACTION_URL\}\}\}/)
    expect(confirmTemplate).toMatch(/\{\{\{USER_NAME\}\}\}/)
    expect(confirmTemplate).not.toMatch(/\{\{\{CONFIRMATION_URL\}\}\}/)
    expect(confirmTemplate).not.toMatch(/\{\{ \.ConfirmationURL \}\}/)
  })
})
