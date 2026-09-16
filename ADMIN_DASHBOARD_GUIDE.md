# Admin Dashboard Guide

Private operations console for Travision Tours. Reachable only at `/admin`,
protected by Cloudflare Access in production and by the development bypass
locally.

## Running locally

```bash
npm run dev          # Vite frontend
npm run dev:worker   # Wrangler worker + local D1 + emulated R2
```

Then open `http://localhost:8787/admin`. The amber **LOCAL DEVELOPMENT AUTH
BYPASS** banner is expected — it means `ENVIRONMENT=development` and
`ACCESS_DEV_BYPASS=true` are set in `.dev.vars`, so the session resolves as
`dev-bypass@localhost` without a real Cloudflare Access login.

The bypass can never run in production: `isAccessBypassed` requires both
conditions, and a production worker that is missing Access configuration fails
closed (403). See `ADMIN_SECURITY_MODEL.md`.

## Sections

| Section | What it does |
| --- | --- |
| Overview | Content counts (published/draft/archived), inquiry and quotation pipeline counts, missing-field queue, recent audit events, release status |
| Tours & trips | Search/filter/sort the CMS catalog; create drafts; edit via grouped field forms; duplicate; approve for release; unpublish; archive/restore; revision history |
| Blog | Same lifecycle for posts, with the exact public Markdown preview (shared `MarkdownContent` component), schedule support, and slug-change redirect prompts |
| Inquiries | List/search inquiries, open full detail, private notes, assignment, status changes, per-inquiry export, one-click "draft quotation" |
| Quotations | Full quotation/policy workflow — see `QUOTATION_OPERATIONS_GUIDE.md` |
| Media | Upload (signature-validated), browse, copy reference URL, usage check, archive |
| Revisions | Cross-entity revision stream (tours, posts, quotations) |
| Audit log | Append-only record of every administrative action |
| Settings | Environment, release status, readiness checklist, deferred domain-phase items |
| Sign out | `/cdn-cgi/access/logout` — clears the Access session in production; a no-op locally |

## Editing workflow

1. Open a tour/post → edit fields → **Save** (creates a revision).
2. **Preview** uses the same renderers as the public site.
3. **Approve for release** marks the current revision `published` — it is
   *not* live yet; it is queued for the next export (see
   `CMS_PUBLISHING_WORKFLOW.md`).
4. **Archive** removes the record from public export without deleting history.

Every save requires the current `revision` number — a stale editor gets a
`revision_conflict` and must reload, so two operators cannot overwrite each
other.

## First run on a fresh database

```bash
npx wrangler d1 migrations apply travision-tours --local
npm run cms:seed       # loads all 34 tours + 5 posts from the static sources
npm run cms:validate   # structural check (0 errors expected; warnings list SEO gaps)
npm run cms:export     # regenerates src/generated/* from published rows
npm run cms:diff       # proves exported content equals the static sources
```

## Narrow viewports

Below 768 px the dashboard shows a warning banner. Quick status changes and
notes are fine on mobile; large editing or quotation workflows should be done
on desktop/tablet. Destructive actions (archive) are unchanged by viewport —
the warning is advisory.

## Adding / removing administrators

Administrators are managed in Cloudflare Access (Zero Trust dashboard →
Access → the Travision application policy), not in this codebase:

- **Add**: append the email to the Access policy allow-list and to the
  `ACCESS_ALLOWED_EMAILS` worker secret.
- **Remove**: delete the email from both places. Access sessions are
  short-lived JWTs; removal takes effect on the next token refresh.
- **Compromise**: remove the email immediately, rotate `ACCESS_ALLOWED_EMAILS`,
  and review `admin_audit_log` (Audit log section) for actions by that actor.

## Deferred to the domain phase

- Cloudflare Access application creation (needs the domain).
- Production D1 database creation + migration apply.
- Production R2 bucket creation + `MEDIA` binding.
- `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, `ACCESS_ALLOWED_EMAILS` production secrets.
- Mailbox + outbound notification provider.
- Deployment of the built site.
