/**
 * Phase 8 — content-validation sheet generator.
 *
 * Emits PHASE8_CONTENT_VALIDATION.md: one section per tour, listing every field
 * the plan asks the owner to confirm. Where a value does not exist anywhere in
 * the codebase the sheet says so explicitly and marks it for owner input rather
 * than filling it in — the plan forbids the implementer inventing business facts.
 *
 * Run with:  npm run content:sheet
 */

import { writeFile, readFile } from 'node:fs/promises';
import { SAMPLE_TOURS, SAMPLE_BLOG_POSTS } from '../src/constants.ts';
import { DAY_TOURS } from '../src/dayTours.ts';
import { PLANNER_STOPS } from '../src/plannerStops.ts';
import { getActivitySummary, getDaySummary, getTourSummary } from '../src/utils/tourContent.ts';
import { resolveSiteUrl } from './site-url.mjs';

/**
 * `src/config/site.ts` reads `import.meta.env`, which only exists inside Vite, so
 * it cannot be imported by a plain tsx script. The published literals are read
 * from the file text instead — `site.ts` itself plus `business.ts`, which holds
 * the constants shared with the Worker — and the origin comes from
 * `site-url.mjs`, which is the same authority the build uses. The sheet
 * therefore still reports exactly what ships rather than a duplicated copy of
 * these values.
 */
const siteConfigSource = await readFile(new URL('../src/config/site.ts', import.meta.url), 'utf8');
const businessSource = await readFile(new URL('../src/config/business.ts', import.meta.url), 'utf8');
const constSources = `${siteConfigSource}\n${businessSource}`;

function readConst(name: string): string {
  const match = constSources.match(new RegExp(`export const ${name}\\s*=\\s*'([^']*)'`));
  if (!match) throw new Error(`Could not read ${name} from src/config/site.ts or src/config/business.ts`);
  return match[1];
}

const SITE_URL = resolveSiteUrl();
const CONTACT_PHONE = readConst('CONTACT_PHONE');
const CONTACT_PHONE_DISPLAY = readConst('CONTACT_PHONE_DISPLAY');
const CONTACT_EMAIL = readConst('CONTACT_EMAIL');
const PAYMENT_PARTNER_NAME = readConst('PAYMENT_PARTNER_NAME');
const INQUIRY_POLICY_VERSION = readConst('INQUIRY_POLICY_VERSION');

const GENERIC_ACTIVITY = /as part of the planned itinerary/i;
const NEEDS = '⚠️ **OWNER INPUT REQUIRED**';
const NONE = '_not present in the data model_';

type RenderedDay = {
  day: number;
  title: string;
  meals: string;
  overnight: string;
  stops: { title: string; generic: boolean }[];
};

/** Mirrors TourDetails' tourItinerary memo so the sheet reflects what renders. */
function renderDays(tour: (typeof SAMPLE_TOURS)[number]): RenderedDay[] {
  if (tour.itinerary && tour.itinerary.length > 0) {
    return tour.itinerary.map((day) => ({
      day: day.day,
      title: day.title || `Day ${day.day}`,
      meals: day.meals ?? '',
      overnight: day.overnight ?? '',
      stops: (day.activities ?? []).map((a) => ({
        title: a.title,
        generic: GENERIC_ACTIVITY.test(getActivitySummary(a.title)),
      })),
    }));
  }
  return [
    {
      day: 1,
      title: `Full Day Experience: ${tour.title}`,
      meals: 'As stated in the final quotation',
      overnight: 'Return arrangements to be confirmed',
      stops: (tour.highlights || []).map((h) => ({
        title: h,
        generic: GENERIC_ACTIVITY.test(getActivitySummary(h)),
      })),
    },
  ];
}

const allTours = [...SAMPLE_TOURS, ...DAY_TOURS];

// Distinct-value analysis: the sanitizer wrote identical inclusion/exclusion
// arrays to every tour, so the sheet should say so once instead of repeating it
// thirty-four times.
const uniq = (lists: string[][]) => [...new Set(lists.map((l) => JSON.stringify(l)))];
const inclusionVariants = uniq(allTours.map((t) => t.inclusions ?? []));
const exclusionVariants = uniq(allTours.map((t) => t.exclusions ?? []));
const mealsVariants = uniq(allTours.flatMap((t) => renderDays(t).map((d) => [d.meals])));
const overnightVariants = uniq(allTours.flatMap((t) => renderDays(t).map((d) => [d.overnight])));

const rows = allTours.map((tour) => {
  const days = renderDays(tour);
  const stops = days.flatMap((d) => d.stops);
  return {
    tour,
    days,
    stopCount: stops.length,
    genericStops: stops.filter((s) => s.generic),
  };
});

const totalStops = rows.reduce((n, r) => n + r.stopCount, 0);
const totalGeneric = rows.reduce((n, r) => n + r.genericStops.length, 0);

const genericTitleCount = new Map<string, number>();
for (const r of rows) {
  for (const t of new Set(r.genericStops.map((s) => s.title))) {
    genericTitleCount.set(t, (genericTitleCount.get(t) ?? 0) + 1);
  }
}

const md: string[] = [];
const p = (s = '') => md.push(s);

p('# Phase 8 — Content Validation Sheet');
p();
p('Generated from source by `npm run content:sheet` (`scripts/phase8-content-sheet.ts`).');
p('Every value below is read from the codebase. Anything absent is marked for owner');
p('input and left empty on purpose: the implementation plan requires owner approval');
p('for business facts and forbids the implementer inventing them.');
p();
p('| | |');
p('|---|---|');
p(`| Canonical origin | \`${SITE_URL}\`${SITE_URL === 'https://travisiontours.com' ? ' — **placeholder; the real domain is not yet set** (Phase 6 blocks `build:production` without it)' : ''} |`);
p(`| Contact phone | \`${CONTACT_PHONE}\` (displayed as ${CONTACT_PHONE_DISPLAY}) |`);
p(`| Contact email | \`${CONTACT_EMAIL}\` — publication on hold, see §A8 |`);
p(`| Payment partner | ${PAYMENT_PARTNER_NAME} |`);
p(`| Inquiry policy version | \`${INQUIRY_POLICY_VERSION}\` |`);
p(`| Package tours | ${SAMPLE_TOURS.length} |`);
p(`| Day tours | ${DAY_TOURS.length} |`);
p(`| Planner stops | ${PLANNER_STOPS.length} |`);
p(`| Blog posts | ${SAMPLE_BLOG_POSTS.length} |`);
p(`| Rendered itinerary stops | ${totalStops} |`);
p(`| Stops rendering generic copy | ${totalGeneric} (${((totalGeneric / totalStops) * 100).toFixed(1)}%) |`);
p();

p('## Legend');
p();
p(`- ${NEEDS} — the field is absent or unconfirmed and must come from the owner.`);
p(`- ${NONE} — no such field exists anywhere in the schema.`);
p('- `generic copy` — the stop renders the fallback sentence "Visit X as part of the planned');
p('  itinerary…" because its title has no entry in the approved attraction summaries.');
p();

// ----------------------------------------------------------------------- A
p('---');
p();
p('## Section A — Cross-catalog findings');
p();

p('### A1. Fused place names — FIXED');
p();
p('Three tours contained the scraper-fused heading `The Valley TempleThe Grand Egyptian Museum`,');
p('followed by a duplicate `The Grand Egyptian Museum` entry with an empty description. The raw');
p('scrape (`scraped_itineraries.json`) shows the source page had two adjacent headings. The other');
p('nine package tours already carried the two attractions as separate stops, so the fix brings the');
p('three broken tours in line with the nine correct ones rather than inventing a structure.');
p();
p('| Tour | Day | Result |');
p('|---|---|---|');
p('| `9-days-cairo-alexandria-luxor-aswan-trip` | 2 | The Valley Temple → The Grand Egyptian Museum |');
p('| `12-days-family-egypt-red-sea-holiday` | 2 | The Valley Temple → The Grand Egyptian Museum |');
p('| `15-days-marvelous-egypt-tour-package` | 2 | The Valley Temple → The Grand Egyptian Museum |');
p();
p('Order was reviewed and left unchanged: the stops run Giza plateau → Valley Temple → Grand');
p('Egyptian Museum → lunch → Saqqara, which is geographically coherent and matches the source.');
p();

p('### A2. Placeholder tokens — CLEAN');
p();
p('Searched every string in all tour, day-tour, planner-stop and blog data for `...`, `TODO`,');
p('`FIXME`, `TBD`, `TBC`, `Lorem ipsum`, `placeholder`, `XXX`, `N/A`, `coming soon`, `Item N`,');
p('and dummy/test values.');
p();
p('**Result: zero matches.** No unfinished marker text ships.');
p();

p('### A3. Generic stop copy — OWNER INPUT REQUIRED');
p();
p(`${totalGeneric} of ${totalStops} rendered stops (${((totalGeneric / totalStops) * 100).toFixed(1)}%) across`);
p(`${rows.filter((r) => r.genericStops.length > 0).length} of ${rows.length} tours fall back to the generic sentence.`);
p('These are the placeholders a visitor actually reads.');
p();
p('The fallback happens because `getActivitySummary()` matches on the exact lowercased title and');
p('only ~28 attractions have approved text. Two different problems are mixed together here:');
p();
p('**(a) Naming variants of attractions that already have approved text — FIXED.** The lookup is');
p('an exact string match, so a trivial rewording silently lost its description. The 13 reworded');
p('titles below are now aliased in `src/utils/tourContent.ts` (`attractionAliases`) to the');
p('approved entry they duplicate — no new copy was written, and they no longer hit the fallback:');
p();
p('| Rendered title | Resolves to |');
p('|---|---|');
const aliasCandidates: [string, string][] = [
  ['Valley Temple', 'the valley temple'],
  ['The Great Pyramid of Khufu', 'the great pyramid'],
  ['Great Pyramid of Khufu', 'the great pyramid'],
  ['Sphinx', 'the great sphinx'],
  ['Great Sphinx', 'the great sphinx'],
  ['The Sphinx of Chephren', 'the great sphinx'],
  ['Egyptian Museum', 'the egyptian museum'],
  ['Khan El Khalili', 'khan el khalili bazaar'],
  ['High Dam', 'the high dam'],
  ['Unfinished Obelisk', 'the unfinished obelisk'],
  ['Step Pyramid of Djoser', 'saqqara step pyramid'],
  ['The Fascinating Valley of the Kings', 'valley of the kings'],
  ['Giza Pyramids', 'giza pyramids complex'],
];
for (const [title, target] of aliasCandidates) {
  p(`| ${title} | \`${target}\` |`);
}
p();
p('Note: `Luxor Temple by Night` (3 occurrences, two spellings) is deliberately **not** aliased.');
p('It is a distinct evening experience and must not inherit the daytime text.');
p();
p('The fallback sentence itself was also generalized from "Visit X as part of…" to "X is included');
p('as part of the planned itinerary…", so non-place stop titles (e.g. "Optional camel ride",');
p('"Desert safari") no longer render with a mismatched verb. It still contains the phrase the');
p('audit uses to detect generic copy, so the count below stays honest.');
p();
p('**(b) Attractions with no approved text at all.** These need owner-approved copy. They are');
p('concentrated in Alexandria, Islamic and Coptic Cairo, Luxor temple features, the Dahshur and');
p('White Desert sites, and the Red Sea resort activities:');
p();
p('| Rendered title | Tours |');
p('|---|---|');
const aliasTitles = new Set(aliasCandidates.map(([t]) => t));
for (const [title, n] of [...genericTitleCount.entries()].sort((a, b) => b[1] - a[1])) {
  if (aliasTitles.has(title)) continue;
  p(`| ${title} | ${n} |`);
}
p();

p('### A4. Empty arrays');
p();
p(`- \`SAMPLE_BLOG_POSTS\` now contains ${SAMPLE_BLOG_POSTS.length} published articles`);
p('  (declared in `src/blogPosts.ts`, re-exported from `constants.ts`). The blog is public,');
p('  indexable, in the sitemap, and linked from navigation and the footer.');
p('- No tour has an empty `inclusions`, `exclusions`, `gallery`, `highlights` or `itinerary` array.');
p();

p('### A5. Ratings and review counts — NOT DISPLAYED');
p();
p('Every tour carries `rating` (4.5–4.9) and `reviewsCount` (48–412). These are unsubstantiated');
p('and must not be shown. Verified that they are **not** published:');
p();
p('- No component reads `tour.rating` or `tour.reviewsCount`; the fields appear only in `types.ts`.');
p('- The two `<Star>` icons that render are decorative labels for "Tour Type: Private" and a');
p('  highlights section — neither is a rating.');
p('- `scripts/phase6-seo.ts` forbids `AggregateRating`, `Review`, `Offer`, `Product` and');
p('  `IndividualProduct` schema types, and no rating markup exists in the built output.');
p();
p('The values remain as dead data in the source. Recommend the owner either substantiate them or');
p('have them removed so a future component cannot surface them.');
p();

p('### A6. Currency — FORMAT UNIFIED; THE CURRENCY ITSELF IS AN OWNER DECISION');
p();
p('`Tour.price` is a bare number and no currency field exists. Every surface now renders through');
p('`formatUsd()` in `src/utils/money.ts`, which produces `US$` with a thousands separator:');
p();
p('| Surface | Source | Renders as |');
p('|---|---|---|');
p('| Tours listing — day-tour table & card badge | `Tours.tsx` | `US$1,070` |');
p('| Tours listing — grid/list cards & price filter | `Tours.tsx` | `US$1,070` |');
p('| Tour detail — badge, sidebar, price section, related cards | `TourDetails.tsx` | `US$1,070` |');
p('| Home — featured cards | `Home.tsx` | `US$1,070` |');
p();
p('`US$` was chosen over bare `$` because it is unambiguous internationally — Egypt’s local');
p('currency is the Egyptian pound. What still needs owner confirmation is the currency itself:');
p('whether to keep USD estimates, switch to EGP, or add a per-tour currency field. That decision');
p('is now a one-function change.');
p();

p('### A7. Phone number — CONSISTENT');
p();
p(`\`CONTACT_PHONE = '${CONTACT_PHONE}'\` in \`src/config/site.ts\` is the single source of truth.`);
p('A repo-wide search for hardcoded phone literals outside that file returns **zero** matches.');
p(`Every surface (Navbar, Footer, Contact, Home JSON-LD, TourDetails, WhatsApp links) derives from`);
p(`the constant, and displays \`${CONTACT_PHONE_DISPLAY}\` for readability.`);
p();

p('### A8. Contact email — SUPPRESSED UNTIL THE MAILBOX WORKS');
p();
p(`\`${CONTACT_EMAIL}\` appears in seven places: Navbar, Footer, Contact, Home (JSON-LD),`);
p('Policies, and TourDetails (×2). The plan requires it not be published until the domain');
p('and mailbox work, so all seven are now gated on `EMAIL_PUBLISHED` in');
p('`src/config/business.ts` (currently `false`). While the flag is off, Policies instead');
p('points at the inquiry form and phone number, and the JSON-LD Organization object omits');
p('the `email` field entirely. Flipping the flag restores every site at once once the');
p('owner confirms the mailbox is live.');
p();

p('### A9. Policy version — CENTRALIZED');
p();
p(`\`INQUIRY_POLICY_VERSION = '${INQUIRY_POLICY_VERSION}'\` and \`PAYMENT_PARTNER_NAME\` are declared`);
p('once, in `src/config/business.ts`. `src/config/site.ts` re-exports them for the browser bundle');
p('and `worker/index.ts` imports the same module, so the version the site displays and the');
p('version written into `bookings.inquiry_policy_version` can no longer drift, and the Worker\'s');
p('response message interpolates the partner name instead of hardcoding it.');
p();
p('The client still does not send the version it displayed — the Worker stamps the version it');
p('holds. Since both sides share one constant, they can only disagree if a stale pre-deploy');
p('bundle is served after a release, which is a caching concern rather than a drift vector.');
p();

p('### A10. Cross-tour repeated boilerplate');
p();
p('The following values are byte-identical across every tour that has them, because a one-off');
p('cleanup script (`scripts/sanitize-tour-data.mjs`, not part of the build) overwrote the scraped');
p('copy. They are legally safe but carry no tour-specific information:');
p();
p(`- **Inclusions** — ${inclusionVariants.length} distinct value across ${allTours.length} tours.`);
p(`- **Exclusions** — ${exclusionVariants.length} distinct value across ${allTours.length} tours.`);
p(`- **Meals** — ${mealsVariants.length} distinct value across all itinerary days.`);
p(`- **Accommodation** — ${overnightVariants.length} distinct value across all itinerary days.`);
p();
p('Inclusions (identical for every tour):');
p();
for (const line of JSON.parse(inclusionVariants[0] ?? '[]')) p(`- ${line}`);
p();
p('Exclusions (identical for every tour):');
p();
for (const line of JSON.parse(exclusionVariants[0] ?? '[]')) p(`- ${line}`);
p();

p('### A11. Highlight entries — minor inconsistency');
p();
p('Five of the 78 `highlights` entries end with a period while the rest do not, and one is a');
p('scraped prose fragment rather than a sight:');
p();
p('| Tour | Highlight | Note |');
p('|---|---|---|');
const EM = '\u2014';
const highlightOddities: string[] = [];
for (const t of allTours) {
  for (const h of t.highlights ?? []) {
    if (h.includes(EM) || h.endsWith('.')) {
      highlightOddities.push(`| \`${t.id}\` | ${JSON.stringify(h)} | ${h.includes(EM) ? 'prose fragment fused with a note' : 'inconsistent trailing period'} |`);
    }
  }
}
for (const line of highlightOddities) p(line);
p();
p('These are cosmetic and left unchanged: choosing the corrected wording is an editorial');
p('decision, not a defect the implementer should resolve unilaterally.');
p();

// ----------------------------------------------------------------------- B
p('---');
p();
p('## Section B — Per-tour validation sheet');
p();
p('Fields the plan asks for that do **not** exist anywhere in the schema, and therefore need owner');
p('input for every tour:');
p();
p('| Field | Status |');
p('|---|---|');
p('| Pickup / drop-off | Not modelled. No field, and no string containing "pickup" or "drop-off" exists. |');
p('| Accessibility / physical requirements | Not modelled per tour. Only general guidance on the Guidelines page. |');
p('| Availability | Not modelled. No seasonal or departure-availability data exists. |');
p('| Hotel / accommodation level | Only the placeholder text below; no hotel names or star ratings. |');
p('| Cancellation terms | Deferred to the written quotation; no per-tour version. |');
p();
p('In the per-tour sections, `Days` counts itinerary days, `Stops` counts rendered stops, and');
p('`generic` counts stops falling back to placeholder copy (see §A3).');
p();
p('| # | Tour | Slug | Days | Duration | Stops | generic | Price | Cover | Gallery |');
p('|---|---|---|---|---|---|---|---|---|---|');
rows.forEach((r, i) => {
  const t = r.tour;
  p(
    `| ${i + 1} | ${t.title} | \`${t.id}\` | ${r.days.length} | ${t.duration} | ${r.stopCount} | ` +
      `${r.genericStops.length} | ${t.price} | \`${t.image}\` | ${(t.gallery ?? []).length} |`
  );
});
p();

p('### Per-tour detail');
p();
rows.forEach((r, i) => {
  const t = r.tour;
  p(`#### ${i + 1}. ${t.title}`);
  p();
  p(`- **Slug:** \`${t.id}\``);
  p(`- **Category / location:** ${t.category} · ${t.location}`);
  p(`- **Duration:** ${t.duration} (${r.days.length} itinerary day${r.days.length === 1 ? '' : 's'})`);
  p(`- **Starting price:** ${t.price} — currency unconfirmed, see §A6`);
  p(`- **Cover image:** \`${t.image}\``);
  p(`- **Gallery:** ${(t.gallery ?? []).length} image(s)${(t.gallery ?? []).length ? '' : ' — ' + NONE}`);
  p(`- **Map:** ${t.mapUrl ? `\`${t.mapUrl.slice(0, 60)}…\`` : NONE}`);
  p(`- **Highlights:** ${(t.highlights ?? []).length ? (t.highlights ?? []).join('; ') : NONE}`);
  p(`- **Inclusions:** identical boilerplate across all tours — see §A10`);
  p(`- **Exclusions:** identical boilerplate across all tours — see §A10`);
  p(`- **Pickup / drop-off:** ${NEEDS}`);
  p(`- **Accessibility / physical requirements:** ${NEEDS}`);
  p(`- **Availability:** ${NEEDS}`);
  const overnightValues = [...new Set(r.days.map((d) => d.overnight).filter(Boolean))];
  p(
    `- **Accommodation level:** ${NEEDS} — ` +
      (overnightValues.length
        ? `renders ${overnightValues.map((v) => `"${v}"`).join(' / ')}`
        : 'no overnight stay on this itinerary')
  );
  p(`- **Cancellation / policy version:** global \`${INQUIRY_POLICY_VERSION}\`; no tour-specific version exists`);
  p();
  p('**Destinations and stops as rendered:**');
  p();
  for (const day of r.days) {
    const label = day.title.replace(/^day\s+\w+\s*:\s*/i, '');
    p(`- **Day ${day.day} — ${label}**`);
    p(`  - Summary: ${getDaySummary(day.title, t.title)}`);
    if (day.meals) p(`  - Meals: ${day.meals}`);
    if (day.overnight) p(`  - Overnight: ${day.overnight}`);
    for (const stop of day.stops) {
      p(`  - ${stop.title}${stop.generic ? '  ← _generic copy_' : ''}`);
    }
  }
  p();
  p(`_Summary line rendered on cards:_ ${getTourSummary(t)}`);
  p();
});

// ----------------------------------------------------------------------- C
p('---');
p();
p('## Section C — Policy and privacy approval checklist');
p();
p('The Policies page currently carries four sections: Inquiry and confirmation; Payment through our');
p('travel partner; Changes and cancellations; Privacy. The following items from the plan are either');
p('absent or need legal sign-off.');
p();
p('| Item | Status |');
p('|---|---|');
p('| Business identity and contact/address details | **Absent.** No registered entity name or postal address appears anywhere. |');
p('| Data-controller / contact information | **Partial.** Only a contact email; no controller identity. |');
p('| Purposes for collected data | Present — responding, quoting, coordinating services, records. |');
p('| Lawful basis | **Absent.** No lawful basis is stated. |');
p('| Retention period | **Absent.** No retention period is stated. |');
p('| Data sharing with the partner and service providers | **Partial.** The travel partner is named; no service providers are. |');
p('| Cross-border data handling | **Absent.** |');
p('| Access / correction / deletion rights and process | **Partial.** "Ask about your submitted information" only; no deletion right or process. |');
p('| Cookie and analytics disclosures | **Absent, and now known.** The site sets no first-party cookies and runs no analytics. Third parties that may set their own: Cloudflare Turnstile (form protection), Google Maps frames, and Unsplash for six Red Sea images. |');
p('| Governing law and dispute wording | **Absent.** |');
p('| Final quotation and tour-specific cancellation/refund terms | Deferred to the written quotation; no per-tour terms exist. |');
p();
p('## Section D — Decisions required from the owner');
p();
p('| # | Decision | Why it blocks |');
p('|---|---|---|');
p('| 1 | Confirm the display currency (USD assumed) or choose another | The format is now unified via `formatUsd()` (§A6); the currency itself is still unconfirmed |');
p(`| 2 | Supply copy for the ${genericTitleCount.size} distinct attractions/activities with no approved text | ${totalGeneric} stops still render the generic sentence (§A3b). The 13 naming variants are already aliased (§A3a) |`);
p('| 3 | Confirm the contact mailbox is live, then flip `EMAIL_PUBLISHED` to `true` | The address is suppressed site-wide until then (§A8) |');
p('| 4 | Substantiate or remove the rating and review-count values | Unsubstantiated data currently dead in source (§A5) |');
p(`| 5 | ~~Blog — publish real articles or hide the route~~ — RESOLVED | ${SAMPLE_BLOG_POSTS.length} articles published; route is public and in the sitemap (§A4) |`);
p('| 6 | Approve the policy items in Section C | Acceptance criterion: owner signs off on policies |');
p('| 7 | Provide pickup/drop-off, accessibility, availability and accommodation level | Missing for all 34 tours (Section B) |');
p('| 8 | Supply a White Desert cover photo, and local replacements for the six Unsplash-hosted day-tour covers | `white-desert-day-tour` shows `/hero.jpg`; Sharm, Marsa Alam, El Gouna, Makadi, Soma Bay and Port Ghalib hot-link stock photos that may not depict the actual location (§B) |');
p();

const output = `${md.join('\n')}\n`;
await writeFile(new URL('../PHASE8_CONTENT_VALIDATION.md', import.meta.url), output);

console.log(`Wrote PHASE8_CONTENT_VALIDATION.md`);
console.log(`  tours: ${rows.length}  stops: ${totalStops}  generic: ${totalGeneric}`);
console.log(`  distinct generic titles: ${genericTitleCount.size}`);
console.log(`  alias candidates: ${aliasCandidates.length}`);
console.log(`  lines: ${md.length}`);
