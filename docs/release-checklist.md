# Release checklist

Use this after CI is green on the release commit. Record date, environment (preview or production), tester, and defects.

## Before promoting code

- [ ] GitHub Actions `verify` and `integration` jobs passed on the commit.
- [ ] New SQL is already applied to the **target** database (`npx supabase db push`), or this release has no schema change.
- [ ] Hosted Auth Site URL is `https://doomsday-watch-group.vercel.app`.
- [ ] Redirect allow-list includes local, production, and Vercel preview patterns in `docs/deployment.md`.
- [ ] Vercel Production env has `VITE_APP_URL`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- [ ] Vercel Preview leaves `VITE_APP_URL` unset and does not define service-role or TMDB tokens.
- [ ] `npm run check:bundle` passed (CI) — no service-role/TMDB secret in the client.

## Preview smoke (Vercel preview URL)

- [ ] Opening `/about` and `/groups/not-a-real-id/watchlist` directly serves the app (no Vercel 404).
- [ ] Sign-up or password-reset email (if used) returns to **this preview origin** `/auth/callback`.
- [ ] Sign in with an existing test account reaches `/app`.
- [ ] Create a group, copy an invite, join as a second user, mark a title watched, save a rating/review.
- [ ] Owner sees the member review; invite/review bodies are not pasted into tickets or logs.

## Production smoke

Production origin: https://doomsday-watch-group.vercel.app

- [ ] Nested route: open `https://doomsday-watch-group.vercel.app/about` in a fresh tab.
- [ ] Auth callback: complete a sign-in or recovery link; land on `/auth/callback` then `/app` (or update-password).
- [ ] Create group → invite → join → watch → review on production (use throwaway accounts).
- [ ] Owner changes current title; dashboard reflects it.
- [ ] Disclaimer still appears on landing/about.
- [ ] Rollback plan is understood: previous Vercel production deployment + forward-fix SQL if needed.

## After release

- [ ] Confirm Vercel production deployment matches the merged `main` SHA.
- [ ] Note any residual defects in the PR or a follow-up issue.
- [ ] Do not keep production invite URLs in chat history.
