# Travision Tours Production Readiness Implementation Plan

## Purpose

This document is the execution brief for bringing the Travision Tours website from its current development state to a production-ready Cloudflare deployment. It is written so another AI agent or developer can perform the work without needing the original audit conversation.

The work is divided into:

1. Work that can and should be completed now, without a domain.
2. Work that requires the final domain, Cloudflare account resources, email/service credentials, or business-owner approval.

Do not deploy the website to production as part of the “now” phases. Local Cloudflare Worker and D1 testing is allowed.

## Non-negotiable business rules

- Travision Tours does not collect or process payments on this website.
- A submitted form is an inquiry or booking request, not a confirmed reservation.
- If a customer accepts a quotation, payment is made directly to the referral partner, Egypt Online Tour.
- The referral partner may accept Visa, Mastercard, Apple Pay, or bank wire transfer using instructions sent privately to the customer.
- Never collect card numbers, CVV values, bank credentials, uploaded identity documents, or payment credentials in this application.
- Do not claim that a tour is confirmed until the referral partner confirms it in writing.
- Starting prices must remain clearly described as estimates unless the business owner supplies confirmed fixed prices.
- Keep the current visual design, typography, colors, spacing language, and overall brand appearance. Functional and accessibility adjustments may be made without redesigning the site.
- Remain compatible with the Cloudflare free tier wherever practical. Do not introduce a required paid Cloudflare product without explicit approval.
- The final per-tour confirmation/cancellation policy will be supplied later by the business owner. Build a place to record and display a policy version, but do not invent contractual terms.

## Repository and current state

- Application: React 19 + TypeScript + Vite.
- Routing: React Router.
- Hosting target: Cloudflare Workers Static Assets.
- API: Cloudflare Worker in `worker/index.ts`.
- Database: Cloudflare D1 with migrations in `migrations/`.
- Current booking endpoint: `POST /api/bookings`.
- Current SEO generation script: `scripts/generate-seo.mjs`.
- Current production configuration file: `wrangler.jsonc`.

At the time this plan was written, the worktree contains uncommitted user work in:

- `src/constants.ts`
- `src/dayTours.ts`
- `src/pages/TourDetails.tsx`
- `src/pages/Tours.tsx`
- New directories under `public/images/day-tours/` and several `public/images/tours/.../` folders

Before making changes, inspect `git status` and `git diff`. Do not discard, reset, overwrite, or mass-format these changes. Create a safety commit or a new branch only with the owner’s authorization. Keep unrelated changes separate.

## Current verified baseline

The following checks passed during the audit:

- `npm run lint` (`tsc --noEmit`)
- `npm run build`
- `npx wrangler deploy --dry-run`
- Local D1 migrations
- Booking API happy path and common validation errors
- Local image-reference existence check
- Recent tour-card click and related-tour changes compile

Known audit findings include:

- 15 production dependency audit findings: 1 critical, 9 high, 3 moderate, and 2 low.
- Approximately 184 MB of production assets, mostly oversized photographs.
- Three active remote image URLs return 404.
- White Desert Day Tour falls back to an unrelated Giza image.
- Shore Excursions filtering includes unrelated inland adventure tours.
- Booking requests are stored but do not reliably notify an operator.
- No Turnstile, robust rate limiting, or idempotency protection.
- Blog and newsletter interactions are incomplete.
- The itinerary planner does not submit its itinerary as an inquiry.
- SPA pages have client-only metadata and unknown pages produce soft 404 responses.
- Automated unit, integration, and browser tests are absent.

## Definition of production ready

The site is production ready only when all of the following are true:

- Every visible navigation item, button, card, filter, form, modal, and external link has an intentional working result.
- No broken or unrelated images appear on any page.
- All production images are optimized for mobile delivery.
- Booking inquiries are stored once, assigned a reference, and reliably surfaced to the business operator.
- Spam and automated form abuse are mitigated server-side.
- No critical or high production dependency vulnerabilities remain without a written risk acceptance.
- Every public page has correct crawlable metadata in its initial HTML.
- Invalid public URLs return a real HTTP 404 response.
- Content, prices, inclusions, policies, and contact information have owner approval.
- Keyboard and screen-reader-critical paths work.
- Automated smoke tests cover the important user journeys.
- Production configuration contains no placeholder IDs, localhost URLs, or development environment values.
- A staging/preview verification passes before production deployment.

---

# Part A — Work to complete now

## Phase 0: Protect the baseline and create an issue ledger

### Tasks

1. Run and record:

   - `git status --short`
   - `git diff --check`
   - `npm run lint`
   - `npm run build`
   - `npm audit --omit=dev`

2. Confirm that the existing photo/card changes are preserved.
3. Create a checklist or issue ledger with one entry per phase in this document.
4. Work in small, reviewable commits. Suggested commit sequence is provided near the end.
5. Never mix generated image binaries, dependency cleanup, content corrections, and API security into one commit.

### Acceptance criteria

- Baseline results are recorded.
- Existing user changes remain intact.
- Each later change can be reviewed or reverted independently.

## Phase 1: Repair broken UI behavior and media mappings

### 1.1 Replace broken remote assets

Known broken assets:

- Blog hero in `src/pages/Blog.tsx`.
- Planner/map image in `src/pages/ItineraryBuilder.tsx`.
- Hieroglyph texture in `src/pages/Home.tsx`.

Tasks:

1. Replace each broken remote URL with an appropriate local asset under `public/images/`.
2. Do not download random third-party images or reuse copyrighted competitor assets.
3. Give each meaningful image accurate, concise alt text. Decorative textures should use empty alt text or CSS backgrounds that are ignored by assistive technology.
4. Remove reliance on remote Unsplash and texture URLs wherever a suitable owner-supplied image exists.
5. Add an automated script/test that extracts local image references from tour data and fails if a referenced file is absent.

Acceptance criteria:

- Network inspection shows no image 404s.
- No active page depends on the three broken URLs.
- All tour cards render an image or an intentional designed placeholder.

### 1.2 Correct every tour-to-photo mapping

Tasks:

1. Audit every entry in `src/dayTours.ts` and `src/constants.ts` against the available image library.
2. Add a destination-correct image for `white-desert-day-tour`; do not allow it to use the generic Giza fallback.
3. Ensure related-tour cards select their own tour image and do not repeat one source tour’s image.
4. Ensure each cover photo’s subject matches the tour location or attraction.
5. Keep a deliberate generic fallback only for unexpected/missing data, and log or test fallback usage so missing mappings cannot silently ship.

Acceptance criteria:

- Every published tour ID resolves to a deliberate image mapping.
- No White Desert, beach, Luxor, Aswan, Alexandria, or Cairo card uses an obviously unrelated destination image.
- Related tour cards remain fully clickable and have distinct relevant images when distinct images exist.

### 1.3 Fix filtering semantics

The current Shore Excursions logic treats any `adventure` category as a sea trip.

Tasks:

1. Replace inferred filter rules with explicit catalog metadata, for example a `collection`, `tourKind`, or `isShoreExcursion` field.
2. Define allowed collections/types centrally rather than inferring them from category names.
3. Assign each tour intentionally to Packages, Day Tours, Nile Cruises, Shore Excursions, or another approved collection.
4. Add tests covering White Desert, Red Sea destinations, Nile cruises, Cairo day tours, and packages.

Acceptance criteria:

- White Desert does not appear under Shore Excursions merely because it is an adventure.
- Query-string filters and navigation tabs return the expected catalog subset.
- Refreshing a filtered URL preserves the chosen filter.

### 1.4 Fix inactive controls

Inventory all buttons and links with special attention to:

- Tour Details sidebar `Help`.
- Blog featured card and `Read Scroll` buttons.
- Newsletter form.
- Planner actions.
- Mobile navigation.
- Search and filter controls.
- Share/send-to-friend interactions.

For each control, either implement its behavior, convert it to the correct semantic link, disable it with an honest explanation, or remove it until the feature exists. Never leave a visually active dead control.

Acceptance criteria:

- A code search and browser walkthrough find no active button without an intentional handler or form action.
- Internal navigation works through keyboard activation as well as pointer clicks.

## Phase 2: Finish or safely hide incomplete content features

### 2.1 Blog

The current blog contains placeholder article bodies and no article route.

Recommended short-term decision:

- If approved articles are not available, remove Blog from public navigation and sitemap, mark `/blog` `noindex`, and do not present fake article cards.
- If the owner provides real articles, implement `/blog/:slug`, article metadata, canonical URLs, publish/modified dates, Article structured data, related content, and a real not-found state.

Tasks if Blog remains public:

1. Replace all `"..."` content with approved original text.
2. Give posts stable slugs instead of UI-only IDs.
3. Make featured and list cards link to individual posts.
4. Add individual post routes.
5. Generate sitemap entries only for published posts.
6. Test nonexistent slugs.

Acceptance criteria:

- No placeholder article is indexable.
- Every visible article card opens a complete article.
- Metadata and structured data match the article shown.

### 2.2 Newsletter

Do not keep a form that silently does nothing.

Choose one of these explicitly:

1. Integrate an approved mailing provider with server-side validation, consent recording, confirmation messaging, abuse protection, and an unsubscribe process; or
2. Remove/hide the newsletter form until a provider and privacy wording are approved.

Do not select a provider, create an account, or add a paid dependency without owner approval.

### 2.3 Itinerary planner

Tasks:

1. Replace the broken decorative map with either:

   - A clearly labeled itinerary preview, or
   - A real map implementation approved for its privacy, API key, and cost implications.

2. Add a `Request this itinerary` action.
3. Submit a normalized itinerary payload to a dedicated endpoint or extend the booking endpoint with a typed inquiry source and selected itinerary items.
4. Store the itinerary server-side with the booking reference.
5. Provide a WhatsApp option containing only a short reference and safe summary; do not place sensitive personal details into the WhatsApp URL.
6. Remove unsupported gamification/rank claims or implement a real, understandable feature.
7. Preserve local save/reorder behavior and handle malformed local-storage data safely.

Acceptance criteria:

- A user can build, reorder, save, restore, and submit an itinerary.
- The operator receives the same reference that the customer sees.
- The planner has no fake interactive map presentation.

## Phase 3: Make booking inquiries reliable

### 3.1 Strengthen request validation

Refactor booking validation into small testable functions shared by the route handler.

Tasks:

1. Validate exact calendar dates rather than relying on `Date.parse` normalization.
2. Reject departure dates earlier than arrival dates.
3. Validate phone numbers to a reasonable international format while accepting common punctuation.
4. Validate email length and syntax.
5. Validate children’s ages as numeric values and require the count to match the selected number of children.
6. Apply explicit limits to every string and array.
7. Validate enumerated fields such as accommodation, contact preference, budget, and referral source.
8. Do not trust client-supplied tour title, price, payment recipient, or policy version. Resolve canonical tour information server-side from an approved catalog representation or accept only a known stable tour ID.
9. Reject unknown tour IDs.
10. Return consistent machine-readable validation errors without exposing stack traces.

Acceptance criteria:

- Invalid dates such as February 31 are rejected.
- Unknown or altered tour IDs cannot create misleading database records.
- Boundary tests exist for all limits and enumerations.

### 3.2 Add idempotency and duplicate prevention

Tasks:

1. Generate a client submission UUID for each intentional form submission.
2. Add a D1 migration containing an idempotency/submission key with a unique index.
3. Replaying the same request should return the original booking reference rather than insert a duplicate.
4. Disable repeated clicks while submission is in progress.
5. Handle browser retry/network timeout behavior without losing the reference.

Acceptance criteria:

- Double-clicking or retrying the same request creates one booking.
- Separate intentional inquiries are still accepted.

### 3.3 Add abuse protection

Prepare the full code path now; production keys are configured later.

Tasks:

1. Add Cloudflare Turnstile to public inquiry forms.
2. Verify the Turnstile token server-side before storing the inquiry.
3. Make verification fail closed when `ENVIRONMENT=production` and the secret is absent or invalid.
4. Provide a documented local-development bypass that cannot activate accidentally in production.
5. Add rate limiting appropriate to the Cloudflare plan available at deployment. Prefer a Cloudflare-native binding/rule; if unavailable on the selected plan, implement a reviewed fallback without storing raw IP addresses indefinitely.
6. Preserve the honeypot as a secondary signal, not the primary defense.
7. Add request body size limits and reject unsupported content types.

Acceptance criteria:

- Missing/invalid Turnstile tokens are rejected in production mode.
- Burst submissions are throttled.
- Normal users receive clear recoverable error messages.

### 3.4 Create a reliable operator notification workflow

Current D1 storage alone is insufficient because no operator is alerted.

Implement a provider-independent notification boundary now:

1. Create a notification adapter/interface separate from request validation and database writes.
2. Add a D1 `notification_outbox` table with booking ID, channel, status, attempt count, last error, and timestamps.
3. Insert the booking and outbox record consistently so a successful booking cannot disappear between storage and notification.
4. Add retry-safe processing. Use a Cloudflare-supported mechanism appropriate to the final plan; do not make successful customer submission depend solely on one fragile third-party API call.
5. In local development, use a safe logging/test adapter that never sends real messages.
6. Later connect the approved email/notification provider with secrets stored through Cloudflare, never in Git.
7. Provide an operational way to list unresolved notification failures.

The customer confirmation must say:

- This is a request, not a confirmed reservation.
- The booking reference.
- Travision or Egypt Online Tour will follow up with a quotation/confirmation.
- Payment instructions, if accepted, come separately and payment goes directly to Egypt Online Tour.

Acceptance criteria:

- Every accepted inquiry is either successfully notified or visibly queued/failed for operator action.
- Provider failure does not lose the inquiry.
- Logs do not expose full personal data.

### 3.5 Provide a secure lead-review method

Choose one with owner approval before launch:

- A minimal admin view protected by Cloudflare Access; or
- A tested operational database/notification workflow that the owner can reliably use.

If building an admin view:

1. Never expose booking list endpoints publicly.
2. Require Cloudflare Access identity and verify the Access JWT in the Worker.
3. Restrict allowed emails/groups.
4. Escape user content and avoid rendering raw HTML.
5. Support list, detail, status change, and audit history; do not add destructive deletion by default.
6. Record who changed status and when.

Acceptance criteria:

- An unauthorized visitor cannot enumerate bookings.
- The operator can find a booking by reference and identify failed notifications.

## Phase 4: Dependency and application security cleanup

### Tasks

1. Use code search to confirm whether each package is used.
2. Remove unused packages, expected to include or investigate:

   - `firebase`
   - `@google/genai`
   - `express`
   - `date-fns`
   - `dotenv`
   - `framer-motion` if the application exclusively imports `motion/react`
   - `clsx`
   - `tailwind-merge`

3. Move build-only dependencies such as Vite and React Vite plugins to `devDependencies` only.
4. Upgrade `react-router-dom`, Vite, Wrangler, and affected transitive dependencies to compatible patched versions.
5. Make upgrades incrementally and run the complete suite after each logical group.
6. Regenerate and commit `package-lock.json` through npm; do not hand-edit it.
7. Re-run `npm audit --omit=dev`.
8. Add a Content Security Policy compatible with local images, approved fonts, Google Maps embeds if retained, WhatsApp links, Turnstile, and the chosen notification architecture.
9. Review `_headers` and Cloudflare settings for HSTS after HTTPS/domain setup.
10. Verify no secrets, API keys, personal data, `.wrangler` state, or environment files are tracked.

Acceptance criteria:

- Zero critical and high vulnerabilities in production dependencies, unless the owner receives a specific written explanation and accepts the risk.
- Application build and behavior remain unchanged except for intentional fixes.
- CSP is tested in report-only mode before enforcement and produces no unexplained violations.

## Phase 5: Image and loading performance

### Asset pipeline

Tasks:

1. Keep original photographs outside the publicly deployed asset directory.
2. Add a repeatable image optimization script, preferably using a maintained Node image tool as a development dependency.
3. Generate responsive widths appropriate to cards, hero banners, and galleries.
4. Generate WebP and/or AVIF plus a reasonable fallback where required.
5. Strip unnecessary metadata while preserving orientation and acceptable visual quality.
6. Use `<picture>`, `srcset`, and `sizes` for major responsive images.
7. Set intrinsic `width` and `height` or CSS `aspect-ratio` to prevent layout shifts.
8. Load only the primary above-the-fold image eagerly. Add `loading="lazy"` and `decoding="async"` to offscreen images.
9. Avoid downloading full gallery images for small cards or thumbnails.
10. Add immutable caching for versioned/hashed optimized images. Do not mark mutable filenames immutable unless filenames change when content changes.
11. Self-host the required font files if licensing permits and preload only fonts used above the fold. Remove the CSS `@import` path.

### Performance budgets

Set and enforce budgets such as:

- No normal card image larger than approximately 200–300 KB.
- No hero image larger than approximately 500–800 KB without documented justification.
- No individual public image above 1 MB without an explicit exception.
- Avoid unnecessary initial-route JavaScript and lazy-load page-level code where useful.

The exact quality/size balance must be visually reviewed on desktop and mobile.

Acceptance criteria:

- Production asset size is materially lower than the current approximately 184 MB.
- Tour-list pages do not eagerly download every full-size photograph.
- No visible image distortion, severe compression, or cropping regression.
- Mobile Lighthouse tests show no image-related critical warning and acceptable Core Web Vitals under a realistic throttled profile.

## Phase 6: SEO architecture and real HTTP status handling

### 6.1 Make metadata available in initial HTML

Recommended approach: statically prerender every public indexable route during the build while retaining client hydration. An equivalent SSR solution is acceptable if it remains simple, maintainable, and Cloudflare-compatible.

Tasks:

1. Generate route-specific HTML for:

   - Home
   - Tour listing variants that should be indexed
   - Every published tour
   - About, Contact, Guidelines, and Policies
   - Every published blog article if Blog remains public

2. Ensure each generated document initially contains its own:

   - Unique title
   - Meta description
   - Canonical URL
   - Open Graph title, description, URL, and image
   - Twitter metadata
   - Appropriate structured data

3. Keep canonical generation environment-based. Do not silently fall back to a domain the owner does not control in a production build.
4. Make production builds fail if the final site URL is absent or is localhost.
5. Generate sitemap and robots files from the same route/catalog source to prevent drift.
6. Do not include query-parameter duplicates unless each is intentionally canonical and contains meaningfully distinct indexable content.
7. Use stable, human-readable tour slugs. If existing slugs change, create permanent redirects.

Acceptance criteria:

- Fetching a tour URL without executing JavaScript returns that tour’s metadata and visible crawlable content.
- Social preview validators see the correct image and description.
- Sitemap contains only canonical, published, indexable URLs.

### 6.2 Eliminate soft 404s

Tasks:

1. Configure the Worker/static routing so known SPA/prerendered routes are served correctly.
2. Return a genuine HTTP 404 with a useful branded page for unknown routes.
3. Return JSON 404 responses for unknown `/api/*` routes.
4. Ensure unknown tour and blog slugs return 404, not a generic page with status 200.
5. Test common asset-like paths and typo URLs.

Acceptance criteria:

- `curl`/HTTP tests confirm status 404 for unknown pages.
- Valid deep links still load directly and hydrate normally.

### 6.3 Structured data review

Tasks:

1. Validate Organization, Breadcrumb, TouristTrip, FAQ, and Article schemas using current validator tools.
2. Ensure structured data states only facts visible on the page.
3. Do not add fake reviews, ratings, availability, or fixed-price Offer markup.
4. Include indicative price information only if schema wording cannot misrepresent it as a purchasable fixed offer.
5. Confirm organization name, phone, email, URL, logo, and social profiles after the domain is chosen.

## Phase 7: Accessibility and responsive interaction

### Tasks

1. Add an accessible name and `aria-expanded`/`aria-controls` to the mobile navigation button.
2. Add correct expanded state and controlled-region relationships to itinerary/FAQ accordions.
3. Add accessible names to planner add, remove, reorder, and share icon buttons.
4. Give search fields persistent labels or `aria-label` values.
5. Add `aria-pressed` to toggle buttons where appropriate.
6. Implement the planner share modal as an accessible dialog:

   - `role="dialog"`
   - `aria-modal="true"`
   - Descriptive title association
   - Initial focus
   - Focus trap
   - Escape to close
   - Restore focus to trigger

7. Restore clearly visible keyboard focus indicators; do not rely only on a subtle border-color change.
8. Add `prefers-reduced-motion` handling for nonessential animations and smooth scrolling.
9. Check headings for a logical hierarchy and landmarks for navigation/main/footer.
10. Check contrast, zoom to 200%, narrow mobile widths, and touch target sizes.
11. Verify form errors are associated with fields and announced by assistive technology.
12. Run automated accessibility checks plus a manual keyboard walkthrough.

Acceptance criteria:

- Entire primary journey works without a mouse.
- No serious/critical automated accessibility violations on core routes.
- Modal and accordion state is understandable to screen-reader users.
- Reduced-motion users do not receive unnecessary motion.

## Phase 8: Content, legal, and trust review

### Catalog cleanup

Tasks:

1. Fix all instances of `The Valley TempleThe Grand Egyptian Museum` and review the intended separation/order.
2. Search for placeholder patterns including `...`, generic “planned itinerary” text, repeated boilerplate, TODOs, and empty arrays.
3. Produce a content-validation sheet for every tour containing:

   - Tour name and slug
   - Destinations and stops
   - Duration
   - Starting price and currency
   - Inclusions and exclusions
   - Meals
   - Hotels/accommodation level
   - Pickup/drop-off
   - Accessibility/physical requirements
   - Availability
   - Cancellation/policy version
   - Cover and gallery images

4. Require owner approval for business facts; the implementer must not invent them.
5. Do not display reviews, review counts, awards, rankings, or ratings unless they are genuine and substantiated.

### Policy and privacy completion

Request owner/legal approval for:

- Business identity and contact/address details.
- Data-controller/contact information.
- Purposes and lawful basis for collected data.
- Retention period.
- Data sharing with Egypt Online Tour and service providers.
- Cross-border data handling where relevant.
- Customer access/correction/deletion rights and request process.
- Cookie/analytics disclosures after the selected tools are known.
- Governing law and dispute wording.
- Final quotation and tour-specific cancellation/refund terms.

Technical tasks:

1. Store the accepted general policy version and timestamp, as the current schema begins to do.
2. Prepare fields for final tour-specific policy/quotation version and acceptance without inventing the policy.
3. Display the payment relationship consistently across form, policies, confirmation, and operator messages.
4. Confirm the phone number is consistently `+201028838866`.
5. Do not publish `info@travisiontours.com` until the domain and mailbox work.

Acceptance criteria:

- No placeholder or contradictory public content remains.
- Owner signs off on the catalog and policies.
- Payment wording is consistent and never implies that Travision processes payment.

## Phase 9: Automated test suite

### Unit tests

Add a maintained TypeScript test runner compatible with Vite.

Cover:

- Booking field validation.
- Exact date validation and date order.
- Tour ID/catalog lookup.
- Child age/count parsing.
- Idempotency behavior.
- Filter classification.
- Sitemap/canonical route generation.
- Image mapping completeness.

### Worker integration tests

Use an isolated local D1 database.

Cover:

- Health endpoint.
- Valid booking creation.
- Invalid content type.
- Malformed JSON.
- Oversized body.
- Missing fields.
- Invalid dates and enumerations.
- Unknown tour ID.
- Missing/invalid Turnstile.
- Duplicate idempotency key.
- Rate-limited request.
- Database failure behavior.
- Notification outbox creation/failure/retry.
- Unknown API route.

Tests must clean up their data or use a disposable database.

### Browser end-to-end tests

Add Playwright or an equivalent maintained browser framework.

At minimum cover desktop and mobile versions of:

1. Home to tour listing to tour details.
2. Clicking anywhere on a tour card.
3. Every top navigation destination.
4. Mobile menu open, navigate, close, and keyboard behavior.
5. Package/Day Tour/Nile Cruise/Shore filters.
6. Search, no-results, and reset behavior.
7. Related tours use correct links and images.
8. Booking validation errors.
9. Successful booking using mocked/local API.
10. Failed/retried booking.
11. Planner add/reorder/save/restore/submit.
12. Blog article flow if Blog remains public.
13. Unknown page and unknown tour 404.
14. Policies/contact/WhatsApp/email links.

### Build and quality scripts

Create clear scripts, for example:

- `typecheck`
- `lint` for actual lint rules
- `test`
- `test:worker`
- `test:e2e`
- `test:a11y`
- `check:images`
- `check:links`
- `build`
- `verify` to run all non-deployment checks

Do not call TypeScript checking “lint” once a real lint step is introduced.

Acceptance criteria:

- One documented command runs all release checks.
- Tests do not call production services or send real notifications.
- Failures produce actionable output.

## Phase 10: Full pre-domain quality gate

Run from a clean install:

1. Remove only generated/reinstallable artifacts when authorized; never delete the repository or user photo library.
2. `npm ci`
3. Typecheck and lint.
4. Unit and Worker integration tests.
5. Image/link/catalog validation.
6. Production build using a safe staging URL.
7. `npx wrangler deploy --dry-run`.
8. Browser E2E suite against a local production-style Worker.
9. Mobile and desktop accessibility checks.
10. Lighthouse/performance tests under throttling.
11. `npm audit --omit=dev`.
12. Secret and accidental-personal-data scan.
13. Review final `git diff --check` and repository status.

Deliver a release-candidate report containing exact command results, remaining warnings, and any owner decisions still required.

---

# Part B — Work after the domain is purchased

## Phase 11: Domain, email, and production identity

Owner inputs required:

- Final domain name.
- Cloudflare account/zone access.
- Working business mailbox.
- Approved company identity and address where legally required.
- Approved notification recipient(s).
- Approved email/notification provider, if one is needed.

Tasks:

1. Add the domain to Cloudflare and configure authoritative DNS.
2. Configure HTTPS and redirect HTTP to HTTPS.
3. Select one canonical hostname (`example.com` or `www.example.com`) and permanently redirect the other.
4. Create and verify the business mailbox.
5. Configure SPF, DKIM, and DMARC for the actual sending arrangement.
6. Replace all temporary/fallback URLs and email values.
7. Set the production `VITE_APP_URL`/site URL.
8. Regenerate canonical tags, Open Graph URLs, sitemap, and robots files.
9. Verify WhatsApp links use `+201028838866` and contain suitable prefilled inquiry text.

Acceptance criteria:

- No localhost or unowned-domain reference exists in production output.
- Canonical host redirects are consistent.
- The business can send and receive mail reliably.

## Phase 12: Production Cloudflare resources

Tasks:

1. Create the production D1 database.
2. Replace the zero UUID in `wrangler.jsonc` using an environment-specific production configuration rather than breaking local development.
3. Apply all migrations to the remote production D1 database.
4. Configure required secrets, such as Turnstile secret and approved notification-provider credentials, with Cloudflare secret management.
5. Configure the Turnstile widget for the actual hostnames.
6. Configure rate limiting using the production account’s available Cloudflare features.
7. Configure Cloudflare Access for any admin surface.
8. Review log sampling and ensure logs do not retain excessive personal data.
9. Configure cache rules for static assets while preventing caching of booking/admin API responses.
10. Enable HSTS only after HTTPS and subdomain behavior have been verified.

Acceptance criteria:

- No placeholder D1 ID or development environment flag is used by production.
- Remote migrations complete successfully.
- Production secrets are absent from source control and client bundles.
- Booking/admin API responses are not publicly cached.

## Phase 13: Staging deployment and real-world verification

Deploy to a non-production/staging hostname first.

Test:

- Direct loading and refreshing of every route.
- Desktop and physical mobile devices.
- Chrome, Safari/WebKit, Firefox, and Edge where practical.
- Real Turnstile success and failure.
- One controlled test inquiry from submission through operator notification.
- D1 record, policy version, booking reference, and status history.
- Notification retry/failure visibility.
- Actual email deliverability and reply path.
- Correct WhatsApp recipient and safe message content.
- 404 and API error statuses.
- Social preview validators.
- Structured data validation.
- Sitemap and robots accessibility.
- Security headers and CSP.
- Performance budgets and Core Web Vitals.

Delete or clearly label test records after verification.

## Phase 14: Search and measurement setup

Owner approval is required before enabling analytics or marketing cookies.

Tasks:

1. Verify the site in Google Search Console.
2. Submit the production sitemap.
3. Request indexing for the home page and key tour pages after verifying rendered HTML.
4. Create or update Google Business Profile using consistent name, phone, URL, and business information.
5. Configure privacy-respecting analytics only after the privacy policy and consent requirements are resolved.
6. Track useful conversion events without sending sensitive booking details:

   - Tour viewed
   - Inquiry form started
   - Inquiry submitted
   - WhatsApp contact clicked
   - Planner inquiry submitted

7. Exclude names, emails, phone numbers, free-text requirements, and booking details from analytics.

Acceptance criteria:

- Search Console accepts the sitemap without canonical/404 errors.
- Analytics events contain no personal data.
- Business identity is consistent across website and search listings.

## Phase 15: Production launch and rollback

Before launch:

1. Record the exact release commit.
2. Back up/export the production D1 schema and confirm recovery steps.
3. Keep the previous successful deployment available for rollback.
4. Run the complete release verification command.
5. Obtain owner approval for content, policies, prices, contact details, and payment wording.

After launch:

1. Submit one controlled inquiry and confirm end-to-end receipt.
2. Monitor Worker errors, notification failures, 404s, and abuse signals.
3. Check Search Console indexing/canonical reports over the following days.
4. Review Core Web Vitals with field data when available.
5. Establish regular dependency, broken-link, backup, and content reviews.

Rollback if booking submission, lead notification, routing, or critical page rendering fails.

---

# Suggested implementation/commit order

Use small commits or pull requests in approximately this order:

1. `fix: repair broken assets and tour image mappings`
2. `fix: correct tour collection filtering and dead controls`
3. `fix: hide or complete unfinished blog and newsletter features`
4. `feat: submit planner itineraries as inquiries`
5. `refactor: centralize booking validation and catalog lookup`
6. `feat: add booking idempotency and notification outbox migrations`
7. `feat: add Turnstile and abuse protection`
8. `feat: add reliable operator notification workflow`
9. `chore: remove unused dependencies and resolve security advisories`
10. `perf: add responsive optimized image pipeline`
11. `feat: prerender public routes and return real 404 responses`
12. `fix: improve keyboard and screen-reader accessibility`
13. `content: correct catalog copy and policy placeholders`
14. `test: add unit Worker and browser release coverage`
15. `chore: add consolidated release verification command`
16. After domain purchase: production domain, D1, Turnstile, notification, and search configuration.

Every commit must pass the relevant tests and must not silently alter tour prices, policies, or business facts.

# Required owner decisions and inputs

Do not guess these values. Track them as explicit blockers:

- Final domain.
- Final business email address.
- Operator notification recipient(s).
- Whether to build an admin lead viewer or use another approved workflow.
- Notification/email provider.
- Whether Blog should be hidden until articles are ready or completed now.
- Whether Newsletter should be removed or connected to an approved provider.
- Whether the planner should show a real third-party map or a non-map itinerary preview.
- Approved final tour descriptions, prices, inclusions, exclusions, and images.
- General policy approval and later per-tour confirmation/cancellation policy.
- Company/legal identity information.
- Analytics/consent decision.

# Final handoff report expected from the implementing AI

The implementing AI must return:

1. A concise list of completed changes grouped by phase.
2. All files added or materially changed.
3. Database migrations added and whether they were applied locally or remotely.
4. Exact test/build/audit commands run and their results.
5. Before/after production asset size and key performance measurements.
6. Remaining owner decisions or blocked tasks.
7. Confirmation that no production deployment occurred unless separately authorized.
8. Confirmation that the site does not collect payments and that all payment wording points to Egypt Online Tour.
9. Confirmation that no secrets or personal test data were committed.
10. A rollback note for any change affecting booking storage, routing, or deployment configuration.

# Copy-ready instruction for another AI

> Implement `PRODUCTION_READINESS_IMPLEMENTATION_PLAN.md` in order. Start by reading the entire document, inspecting the current Git status/diff, and preserving all existing user photo and clickable-card work. Complete only Part A unless I explicitly provide the final domain and authorize Part B. Keep the current design. Do not deploy. Do not invent prices, policies, reviews, legal terms, or business information. The website must never collect payment credentials; booking forms are requests only, and accepted payments go directly to Egypt Online Tour by Visa, Mastercard, Apple Pay, or bank wire using privately supplied instructions. Work in small reviewable commits, run the specified verification after each phase, and stop for owner input only where this plan marks a required business decision.
