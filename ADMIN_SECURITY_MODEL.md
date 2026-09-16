# Admin Security Model

## Boundaries

`/admin` is a single noindex, robots-disallowed SPA route. **Security is not
the absence of a link** — the real boundary is that every `/api/admin/*`
request passes `requireAccessIdentity` before any data is touched
(`worker/admin.ts`).

1. **Cloudflare Access** (production, domain phase): deny-by-default
   application policy in front of `travisiontours.com/admin*` and
   `/api/admin/*`. Login is via the configured IdP or one-time PIN — there is
   no password database, registration, or reset flow in this codebase.
2. **Worker JWT verification** (`worker/access.ts`): the Worker independently
   verifies `Cf-Access-Jwt-Assertion` — RS256 signature against the team's
   published certs (`kid` lookup), issuer, audience (`ACCESS_AUD`),
   expiration — then checks the token email against `ACCESS_ALLOWED_EMAILS`.
   The `CF_Authorization` cookie alone is never trusted.
3. **Fail closed**: a production worker missing `ACCESS_TEAM_DOMAIN` or
   `ACCESS_AUD` answers 403 for every admin request.
4. **Development bypass**: `isAccessBypassed` requires
   `ENVIRONMENT === 'development'` *and* `ACCESS_DEV_BYPASS === 'true'`. The
   flag exists only in `.dev.vars` (git-ignored) — it is never declared in
   `wrangler.jsonc`, and no query parameter, header, or cookie can substitute
   for it. Covered by `tests/unit/worker-boundaries.test.ts`.
5. **Same-origin guard** (`worker/requestGuard.ts`): state-changing requests
   must carry a matching `Origin` or a `Sec-Fetch-Site` of `same-origin`/
   `same-site`/`none` — cross-site POSTs are rejected before routing.
6. **Admin rate limit** (`worker/rateLimit.ts` `enforceScopedRateLimit`):
   mutations are throttled per actor email (default 120/min), separate from
   the public inquiry limiter.
7. **Input discipline**: bounded JSON bodies (`MAX_ADMIN_BODY_BYTES`),
   whitelist field patching (unknown fields are rejected, not dropped),
   unsafe-markup detection (`<script>`, `<iframe`, `on*=`, `javascript:`),
   server-side slug validation, and parameterized queries everywhere.
8. **Audit** (`worker/audit.ts`): every mutation appends
   `(actor, action, entity, summary)` to `admin_audit_log` in the same D1
   batch — a change cannot land without its audit row.

## What is never stored or exposed

- No Access tokens in `localStorage`/cookies set by this app.
- No payment-card data anywhere — there are no card fields to store.
- Internal notes stay server-side (`internal_notes`, `inquiry_notes`) and can
  never reach the rendered quotation document or exports.
- The prerendered `/admin` HTML contains only a "checking access" shell.
- The session endpoint reveals only `{authorized, email, devBypass,
  environment}` for the already-verified caller.

## Logout

The Sign-out control navigates to `/cdn-cgi/access/logout`, which Access
intercepts to clear its session cookie. In the dev bypass there is nothing to
clear — the banner says so.

## Incident response

If an administrator account is compromised:

1. Remove the email from the Access policy and `ACCESS_ALLOWED_EMAILS`.
2. Review `admin_audit_log` filtered by that actor (Audit log section or
   `GET /api/admin/audit?entity_type=…`).
3. Restore altered content via the Revisions section (per-entity restore).
4. Rotate `RATE_LIMIT_SALT` if rate-limit fingerprinting is a concern.
