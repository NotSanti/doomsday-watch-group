# Push notifications (PWA)

Doomsday Watch Group uses the Web Push API for installable PWA notifications.

## Events

- Member joins a group
- Member marks a title watched
- Member saves a rating
- Member publishes review text
- Everyone finishes the current title (auto-advances `current_title_id` and notifies the group)
- Daily global countdown to Doomsday (opt-in from Profile)

## Setup

### 1. Generate VAPID keys

```bash
npx web-push generate-vapid-keys
```

### 2. Client (Vite / Vercel)

Set in `.env` and Vercel project settings:

```env
VITE_VAPID_PUBLIC_KEY=<public-key>
```

Never put the private key in `VITE_*` variables or the client bundle.

### 3. Supabase Edge Function secrets

Add to `supabase/functions/.env`, then deploy:

```bash
supabase secrets set --env-file supabase/functions/.env
```

Required secrets:

```env
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:noreply@doomwatchparty.online
PUSH_INTERNAL_SECRET=
```

`PUSH_INTERNAL_SECRET` must match `private.runtime_config.push_internal_secret` in Postgres. Update hosted values with:

```sql
update private.runtime_config
set value = '<your-secret>'
where key = 'push_internal_secret';

update private.runtime_config
set value = 'https://<project-ref>.supabase.co/functions/v1'
where key = 'functions_base_url';

update private.runtime_config
set value = 'https://doomwatchparty.online'
where key = 'app_base_url';
```

### 4. Daily countdown schedule

In the Supabase Dashboard, schedule the `send-daily-countdown` Edge Function (recommended: `0 14 * * *` UTC).

Invoke manually for smoke tests:

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/send-daily-countdown" \
  -H "X-Push-Internal-Secret: <secret>"
```

## User flow

1. Open **Profile** in the app.
2. Turn on **Daily Doomsday countdown** to receive one reminder each day around 10:00 AM Eastern (2:00 PM UTC).
3. Tap **Enable on this device** and allow browser permission (required to receive any push).
4. Optionally toggle group-activity notification categories.
5. Use **Send test notification** to verify delivery.

### iOS

Push works for PWAs added to the Home Screen on iOS 16.4+. Safari in a tab does not receive push on iOS.

## Local development

- `vite-plugin-pwa` registers the service worker in dev when enabled.
- Web Push still requires a secure origin (HTTPS). Use a Vercel preview deploy or local HTTPS for end-to-end push testing.
- Database triggers enqueue rows in `notification_outbox` and call `send-push-notification` through `pg_net`.

## Security

- Users manage only their own rows in `push_subscriptions` and `notification_preferences` (RLS).
- `notification_outbox` is server-only; delivery runs with the service role inside Edge Functions.
- Internal dispatch uses `PUSH_INTERNAL_SECRET`; test sends require a user JWT.
