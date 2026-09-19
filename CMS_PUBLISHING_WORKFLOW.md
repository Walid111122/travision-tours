# CMS Publishing Workflow

How a draft in D1 becomes a public page — deliberately multi-step so a saved
draft can never appear on the site by accident.

## The four states of content

| Label in the UI | Meaning |
| --- | --- |
| Draft | Stored in `cms_tours`/`cms_posts`, visible only in `/admin` |
| Approved for release | `status = 'published'` — validated, queued for export |
| Exported | `npm run cms:export` wrote it into `src/generated/*` for the build |
| Live | The site was built and deployed — a separate, manual step |

The dashboard never claims content is "live" because it was saved.

## Commands

```bash
npm run cms:seed       # idempotent import of the static catalog into D1
npm run cms:validate   # structural + safety validation of every row
npm run cms:export     # deterministic export of published rows → src/generated/
npm run cms:diff       # zero-diff proof between published rows and static sources
```

### cms:seed

Reads `src/constants.ts` (`SAMPLE_TOURS` → `collection='package'`) and
`src/dayTours.ts` (`collection='day_tour'`) plus `src/blogPosts.ts`, maps each
to a CMS row (`src/cms/model.ts`), and emits `INSERT … ON CONFLICT DO NOTHING`
statements against the local D1 via `scripts/cms-d1.ts`. Re-running it changes
nothing. A reconciliation report compares source vs. database row counts and
fails visibly on any mismatch. Originals stay in the repo — they remain the
authority until parity has been proven on every release.

### cms:export

Selects rows with `status = 'published'` only — drafts and archived rows can
never reach the public bundle — and writes:

- `src/generated/packages.ts` (`GENERATED_PACKAGES`)
- `src/generated/day-tours.ts` (`GENERATED_DAY_TOURS`)
- `src/generated/blog-posts.ts` (`GENERATED_BLOG_POSTS`)

Serialization is deterministic (sorted keys, fixed formatting) so an
unchanged database produces byte-identical output. `src/generated/` is
git-ignored for lint only — the files are committed as build inputs when a
release is prepared.

### cms:diff

Re-maps every published row through `rowToTour`/`rowToPost` and diffs against
the static constants field-by-field. `0 difference(s)` means the CMS content
and the shipped site are identical.

### cms:validate

Reports errors (block publish) and warnings (quality queue — e.g. missing
meta descriptions, missing cover images, posts without internal links). The
current seeded catalog validates with **0 errors / 34 warnings** — the
warnings are pre-existing SEO gaps in the source data (tours without a meta
description), surfaced so an operator can fix them deliberately rather than
silently.

## Release procedure (domain phase)

1. Edit + preview in `/admin`, then **Approve for release**.
2. `npm run cms:export` → `npm run cms:diff` (expect only intended changes).
3. `npm run build` → the prerenderer emits updated HTML/sitemap/JSON-LD.
4. Run the verification gates (images, SEO, CSP, a11y).
5. Commit `src/generated/*` and deploy separately.

Drafts are never in `src/generated`, never in the sitemap, and unreachable on
public routes — the public app still renders from the static modules until a
release deliberately swaps them.

## Redirects

Renaming a published post slug requires `redirectFrom` (recorded in
`cms_redirects`). The export step can then emit redirect entries — wiring
those into the build's redirect manifest is part of the domain phase.
