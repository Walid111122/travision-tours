# Devin SWE-2 handoff — finish pre-domain production readiness

## Objective

Finish and verify the remaining **pre-domain** work for Travision Tours. Do not deploy, purchase or configure a domain, create production Cloudflare resources, change DNS, create email accounts, or push/commit unless the owner explicitly asks later.

The worktree already contains substantial changes from another agent and from Codex. Preserve all existing work. Do not reset, revert, delete, or mechanically replace unrelated changes.

## Read these first, in this order

1. `PRODUCTION_READINESS_IMPLEMENTATION_PLAN.md` — scope, business rules, phases, acceptance criteria, and owner-only decisions.
2. `PHASE8_CONTENT_VALIDATION.md` — verified catalog/content gaps. Never invent facts marked `OWNER INPUT REQUIRED`.
3. `package.json`, `.env.example`, `wrangler.jsonc`, `playwright.config.ts`, and `vitest.config.ts` — build and test contract.
4. `src/config/site.ts`, `src/catalog.ts`, `src/dayTours.ts`, `src/constants.ts`, `src/routeTable.ts`, and `src/routes.ts` — public catalog and site identity.
5. `worker/index.ts`, every file under `worker/`, and migrations `0001` through `0007` — booking, D1, Turnstile, idempotency, rate limiting, notifications, and admin security.
6. Every file under `tests/` plus `scripts/phase5-images.ts`, `scripts/phase6-seo.ts`, `scripts/phase7-a11y.mjs`, `scripts/phase7-keyboard.mjs`, `scripts/check-csp.mjs`, and `scripts/check-budget.mjs`.
7. Run `git status --short` and inspect the complete diff before editing. Assume every existing change belongs to the owner or prior agents.

## Non-negotiable business rules

- The website collects booking/inquiry requests only; it does not collect card or banking details.
- Visa, Mastercard, Apple Pay, and wire transfer are paid directly to the referral company, Egypt Online Tour, only after written quotation/confirmation.
- Contact phone/WhatsApp is `+201028838866`.
- The owner will provide the final tour-specific policy later. Do not invent policy terms, cancellation deadlines, prices, itinerary facts, reviews, licenses, addresses, or legal claims.
- Keep the existing visual design.
- Remain compatible with Cloudflare Workers + Static Assets + D1 and the Cloudflare free tier.
- Domain, production email, DNS, Cloudflare secrets/resources, deployment, Search Console, and analytics are deliberately deferred to the final phase.

## Current verified baseline

- ESLint and TypeScript pass.
- Vitest passes: 136 passed and 2 intentional expected failures (138 total), including 40 real Worker/D1 integration tests.
- Production-style build succeeds and prerenders 43 routes plus `404.html`.
- Image audit: 34/34 pass.
- SEO audit: 41/41 pass.
- CSP checker passes in report-only mode.
- Image/font performance budget passes (about 29.6 MB total images; largest image about 226 KB).
- Desktop Playwright suite passed 46 tests with 1 intended mobile-menu skip.
- Mobile Playwright suite passed 44 tests with 1 intended desktop-only skip. Its two contact failures were test-selector errors; the email selectors were corrected. One final WhatsApp selector still needs the same correction described below.
- Booking idempotency is bound to a normalized request fingerprint via migration `0007`; replay happens before rate limiting and Turnstile, and mismatched reuse returns HTTP 409.

## Remaining implementation tasks

1. In `tests/e2e/site.spec.ts`, change the final tour-page WhatsApp assertion to select the visible link (the page contains a hidden desktop/sidebar link on mobile), just as the email selector now uses `:visible`. Re-run the affected mobile file and then the complete Playwright suite.
2. Run the full quality gate. Fix genuine application or test-infrastructure failures, but do not weaken assertions to hide product bugs:
   - `npm run verify`
   - `npm run test:a11y`
   - `npm run test:keyboard`
   If the accessibility scripts require a local Worker, start it against local/disposable D1 only and never touch production.
3. Review Phase 7 accessibility behavior manually/in browser where automation flags uncertainty: keyboard navigation, mobile menu, modals/focus return, accordion state, visible focus, and reduced motion. Make only evidence-backed fixes.
4. Review the remaining technical Phase 8 inconsistencies that do not require owner facts. Centralize duplicated policy/business constants if this can be done without coupling browser-only environment code to the Worker. Do not rewrite tour copy or policy language.
5. Inspect production configuration for Cloudflare free-tier compatibility. Do not deploy. Keep Turnstile server validation, D1 migrations, secure admin access, notification outbox behavior, CSP, and real HTTP 404 handling intact.
6. Run `git diff --check`, `npm audit --audit-level=high`, and a Wrangler dry run. Do not commit or push.

## Known owner/data blockers — report, do not fabricate

- `white-desert-day-tour` has no relevant local photo. `C:\travision photos` contains no White Desert/Farafra image; the only filename containing “white” is a Red Sea beach photo and must not be used. The current fallback is `/hero.jpg`. Do not substitute a Giza, beach, or AI-generated image. Record this as owner input required unless a genuinely relevant, licensed local asset already exists elsewhere in the repository.
- The content sheet identifies generic stop descriptions that need owner-approved wording.
- Final tour-specific booking/cancellation policy will be supplied by the owner later.
- Final domain and real mailbox do not exist yet.
- Any unresolved currency presentation choice that requires an owner decision should remain documented rather than guessed.

## Completion report

Create `DEVIN_COMPLETION_REPORT.md` containing:

- files changed and why;
- each command run and its exact pass/fail/skip counts;
- unresolved owner inputs, separated from technical defects;
- confirmation that no deployment, domain work, production resource creation, commit, or push occurred;
- any risks or failures still preventing pre-domain sign-off.

Do not state “production ready” merely because a build succeeds. Pre-domain technical sign-off requires every executable check above to pass, with only explicitly justified skips.
