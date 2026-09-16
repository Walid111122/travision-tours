# Launch Checklist — Travision Tours

The site is **pre-domain ready**: all engineering and verification that does
not require live infrastructure is done. This checklist is the ordered path
from here to a public launch. Owner decisions are in
`CONTENT_GAPS.md` and `PHASE8_CONTENT_VALIDATION.md` §D — resolve them first.

## 1. Owner blockers (before any launch step)

- [ ] Confirm display currency (USD assumed — `formatUsd` is a one-function
      change if EGP or a per-tour field is wanted instead).
- [ ] Supply copy for the 51 uncovered attractions/activities (§A3b) or accept
      the generic sentence on 65 stops.
- [x] Replace the White Desert placeholder and six remote Red Sea covers with
      original, locally hosted destination-specific images.
- [x] Supply per-tour logistics — sourced from Egypt Online Tour where a
      reliable page exists (11 exact, 8 partial/category matches in
      `src/tourPolicies.ts`); the 15 unmapped tours still need owner input
      or a partner data sheet — see `CONTENT_GAPS.md`.
- [x] Remove unsubstantiated `rating`/`reviewsCount` data — fields deleted
      from the data model.
- [ ] Review the five published blog articles (`/blog`) for voice and
      factual accuracy before launch.
- [ ] Owner/legal sign-off on the `/policies` wording — the partner's
      standard terms are paraphrased and attributed but not legally reviewed
      (Section C items: business identity, lawful basis, retention,
      governing law remain absent).
- [ ] Confirm per-tour or final cancellation/refund terms (currently deferred
      to the written quotation by design).

## 2. Domain and mail

- [ ] Register/confirm the domain.
- [ ] Provision the mailbox for `info@travisiontours.com` and verify it
      receives mail.
- [ ] Flip `EMAIL_PUBLISHED` to `true` in `src/config/business.ts` — restores
      the address in all seven suppressed locations at once.
- [ ] Set `SITE_URL` in `.env` (see `.env.example`) — `build:production`
      refuses to run without a real origin.

## 3. Cloudflare production resources (free tier)

- [ ] `wrangler login`, then create the production D1 database and update
      `database_id` in `wrangler.jsonc`.
- [ ] `wrangler d1 migrations apply travision-tours --remote`.
- [ ] Create a Turnstile site, then `wrangler secret put TURNSTILE_SECRET_KEY`
      and set `VITE_TURNSTILE_SITE_KEY` in `.env`.
- [ ] Create the Cloudflare Access application for `/admin`; set
      `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, `ACCESS_ALLOWED_EMAILS`.
- [ ] `wrangler secret put RATE_LIMIT_SALT` (any random string).
- [ ] Configure the operator notification webhook
      (`NOTIFICATION_WEBHOOK_URL`, `NOTIFICATION_WEBHOOK_TOKEN`) or accept
      log-only notifications.
- [ ] `.dev.vars.example` documents every secret key — copy to `.dev.vars`
      for local work.

## 4. Deploy and verify

- [ ] `npm run build:production && npm run verify` — all gates green.
- [ ] `wrangler deploy` (first real deployment).
- [ ] Point DNS at the Worker / configure the custom domain.
- [ ] Submit one controlled inquiry end-to-end; confirm D1 row + operator
      notification.
- [ ] Verify the `/admin` route requires Access and serves real data.
- [ ] Confirm sitemap.xml and robots.txt resolve on the production origin.

## 5. Post-launch (from implementation plan §15)

- [ ] Submit sitemap in Search Console; watch canonical/404 reports.
- [ ] Add analytics (decision deferred — none configured today).
- [ ] Monitor Worker errors, notification failures, abuse signals.
- [ ] Keep the previous deployment available for rollback; rollback triggers:
      booking submission, lead notification, routing, or critical rendering.

## Rollback

`wrangler rollback` (or redeploy the previous commit). Roll back if booking
submission, lead notification, routing, or critical page rendering fails.
