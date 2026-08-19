# QA checklist

Manual and automated checks for the Doomsday Watch Group MVP before release. Run against local Supabase (`npx supabase start` + `npx supabase db reset`) unless noted.

## Automated gates

- [ ] `npm run lint`
- [ ] `npm run format:check`
- [ ] `npm run typecheck`
- [ ] `npm test` (Vitest unit/integration)
- [ ] `npm run build`
- [ ] `npm run check:bundle` (no service-role/TMDB token in `dist/`)
- [ ] `npm run audit:deps` (no unmitigated high-severity npm advisories)
- [ ] `npx supabase test db` (RLS and RPC policy tests)
- [ ] `npm run test:e2e` (Playwright against local Supabase + Vite dev server)

## Critical user journeys

### Owner onboarding

- [ ] Sign up with email/password and display name lands on `/app`.
- [ ] Create group validates name length and enters the dashboard as owner.
- [ ] Group settings: rename, description, timezone, and target date save correctly.
- [ ] Create invite copies a link; link works until revoked.
- [ ] Owner can set/change current title; dashboard and watchlist reflect it.

### Member onboarding

- [ ] Invite preview shows group name, owner, and member count when valid.
- [ ] Signed-out visitor is prompted to sign in before joining.
- [ ] New member completes join and sees the private dashboard/watchlist.
- [ ] Member can mark a title watched and update only their own status.

### Reviews

- [ ] Half-star ratings accept 1–10 in 0.5 steps; invalid values are rejected in UI.
- [ ] Save/update/delete review works; group average and count refresh.
- [ ] Spoiler reviews stay covered until explicitly revealed.
- [ ] Another member in the same group sees the review; outsiders cannot query it (RLS).

### Administration

- [ ] Owner can remove a member; removed user immediately loses group routes.
- [ ] Owner can transfer ownership; former owner becomes member.
- [ ] Owner cannot leave without transferring or deleting the group.
- [ ] Typed-name delete removes the group and clears access for all members.
- [ ] Member can leave a non-owned group from settings.

### Access control

- [ ] Non-member opening `/groups/:id` sees “Group not available”.
- [ ] Expired, revoked, exhausted, and invalid invites show friendly errors (revoked/invalid covered by Playwright; expired/exhausted by DB tests).
- [ ] Direct URL to another group’s title/review data fails at the database boundary.

## Realtime (multi-session)

- [ ] Two browsers in the same group: watch status change appears without manual refresh.
- [ ] Review save in one session appears in the other after a short delay.
- [ ] Switching groups tears down the previous subscription (no cross-group updates).
- [ ] Sign-out clears subscriptions; mutations still work if realtime disconnects.

## Responsive and keyboard

- [ ] Mobile viewport: app nav reaches Dashboard, Watchlist, Members, Settings.
- [ ] Skip link focuses main content.
- [ ] Auth, create-group dialog, status pill, and rating stars are keyboard operable.
- [ ] Focus rings visible on interactive controls (axe serious violations = 0 on dashboard sample).

## Content and compliance

- [ ] Landing/about include the unofficial-fan disclaimer.
- [ ] TMDB attribution present where artwork/metadata is shown.
- [ ] No Marvel/Disney logos or copied proprietary layouts.

## Production smoke (after deploy)

Full checklist: `docs/release-checklist.md`. Minimum:

- [ ] Nested client route loads directly (e.g. `/about` or `/groups/:id/watchlist`).
- [ ] Auth callback works on that origin.
- [ ] Create group → invite → join → watch → review on the target backend.
- [ ] Migrations were applied before promoting incompatible frontend code.

Record date, environment (local/preview/prod), tester, and any defects in the release notes.
