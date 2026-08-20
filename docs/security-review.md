# Security review — Milestone 11

Working name: **Doomsday Watch Group**. Unofficial fan project; not affiliated with Marvel or Disney.

Review date: 2026-08-19  
Scope: MVP client, Supabase schema/RLS, local E2E harness, production bundle.

## Summary

The browser bundle uses only the Supabase publishable (anon) key. Privileged writes (group creation, invite redemption, ownership transfer, leave/delete) go through Postgres functions guarded by membership helpers. Row Level Security enforces the group boundary on every exposed table. Playwright E2E runs against local Supabase with a service-role helper confined to the test process (never shipped to clients).

## Client exposure

| Check                           | Result    | Notes                                                                                                                                    |
| ------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Service-role key in Vite bundle | Pass      | `npm run check:bundle` scans `dist/assets/*.js` for service-role markers, `sb_secret_`, Resend `re_` keys, and `TMDB_API_READ_TOKEN`. |
| TMDB token in client            | Pass      | `TMDB_API_READ_TOKEN` is documented server/script-only; not referenced from `src/`.                                                      |
| Resend API key in client        | Pass      | `RESEND_API_KEY` is an Edge Function secret only; not a `VITE_` var and not read by `parseClientEnv`.                                   |
| `VITE_*` secret leakage         | Pass      | `.env.example` lists names only; `.gitignore` excludes `.env` and `.env.*`.                                                              |
| Invite tokens in URLs           | By design | Invite links include the raw token in the path for redemption; owners can recopy until revoke. Do not log full invite URLs in analytics. |

## Authorization model

- **Boundary:** active membership in `group_members`.
- **Enforcement:** RLS on groups, members, invites (owner read for token recopy), progress, reviews; atomic RPCs for create/redeem/transfer/leave.
- **UI hiding is not auth:** non-members hitting group routes see empty/unavailable states; database denies cross-group reads/writes (covered by `supabase/tests/database.test.sql`).

## Dependency audit

Command: `npm run audit:deps` (`npm audit --audit-level=high`).

Latest run (Milestone 11): **0 high or critical** vulnerabilities in production dependencies.

Re-run before each release; document any accepted risk with mitigation and review date in this file.

## Error monitoring and logging

- No third-party error monitoring SDK is integrated in the MVP client.
- **Guidance if added later:** scrub invite tokens from URLs, avoid sending review bodies/spoiler text, and never attach Supabase service-role or TMDB tokens to error reports.
- Client toasts use friendly copy; raw Postgres errors are mapped in feature `*-errors.ts` modules.

## E2E and CI secrets

- `E2E_SUPABASE_SERVICE_ROLE_KEY` is required only for Playwright global setup/helpers (seed expired invites). Keep it in local `.env` and CI secrets; never prefix with `VITE_`.
- Playwright loads `.env` locally; production/preview Vercel projects must not define the service-role key.
- GitHub Actions starts ephemeral local Supabase for database tests and Playwright; hosted keys are not stored in repository secrets for those jobs.

## Realtime

- Subscriptions are scoped by `group_id` filters on a single channel per active group.
- Correctness does not depend on WebSockets; disconnects fall back to query invalidation/refetch.

## Known limitations (accepted for MVP)

- Email auth only; no MFA.
- Invite links are secret URLs; no additional step-up for join beyond sign-in.
- Rate limiting relies on Supabase/platform defaults; no custom app-level throttling.
- Catalog IDs and TMDB artwork paths are public read for authenticated members.

## Recommended follow-ups (post-MVP)

- Periodic `npm audit` and dependency update cadence.
- Dedicated preview/staging Supabase project (preview currently may share hosted production).
- CSP headers and security.txt on production domain.

## Verification commands

```bash
npm run verify
npx supabase test db
npm run test:e2e
```

Sign-off: automated checks passing on 2026-08-19 for Milestone 11 implementation.
