# Phase 8 — Content Validation Sheet

Generated from source by `npm run content:sheet` (`scripts/phase8-content-sheet.ts`).
Every value below is read from the codebase. Anything absent is marked for owner
input and left empty on purpose: the implementation plan requires owner approval
for business facts and forbids the implementer inventing them.

| | |
|---|---|
| Canonical origin | `https://travisiontours.com` — **placeholder; the real domain is not yet set** (Phase 6 blocks `build:production` without it) |
| Contact phone | `+201028838866` (displayed as (+20) 102 883 8866) |
| Contact email | `info@travisiontours.com` — publication on hold, see §A8 |
| Payment partner | Egypt Online Tour |
| Inquiry policy version | `2026-08-13` |
| Package tours | 12 |
| Day tours | 22 |
| Planner stops | 38 |
| Blog posts | 5 |
| Rendered itinerary stops | 338 |
| Stops rendering generic copy | 65 (19.2%) |

## Legend

- ⚠️ **OWNER INPUT REQUIRED** — the field is absent or unconfirmed and must come from the owner.
- _not present in the data model_ — no such field exists anywhere in the schema.
- `generic copy` — the stop renders the fallback sentence "Visit X as part of the planned
  itinerary…" because its title has no entry in the approved attraction summaries.

---

## Section A — Cross-catalog findings

### A1. Fused place names — FIXED

Three tours contained the scraper-fused heading `The Valley TempleThe Grand Egyptian Museum`,
followed by a duplicate `The Grand Egyptian Museum` entry with an empty description. The raw
scrape (`scraped_itineraries.json`) shows the source page had two adjacent headings. The other
nine package tours already carried the two attractions as separate stops, so the fix brings the
three broken tours in line with the nine correct ones rather than inventing a structure.

| Tour | Day | Result |
|---|---|---|
| `9-days-cairo-alexandria-luxor-aswan-trip` | 2 | The Valley Temple → The Grand Egyptian Museum |
| `12-days-family-egypt-red-sea-holiday` | 2 | The Valley Temple → The Grand Egyptian Museum |
| `15-days-marvelous-egypt-tour-package` | 2 | The Valley Temple → The Grand Egyptian Museum |

Order was reviewed and left unchanged: the stops run Giza plateau → Valley Temple → Grand
Egyptian Museum → lunch → Saqqara, which is geographically coherent and matches the source.

### A2. Placeholder tokens — CLEAN

Searched every string in all tour, day-tour, planner-stop and blog data for `...`, `TODO`,
`FIXME`, `TBD`, `TBC`, `Lorem ipsum`, `placeholder`, `XXX`, `N/A`, `coming soon`, `Item N`,
and dummy/test values.

**Result: zero matches.** No unfinished marker text ships.

### A3. Generic stop copy — OWNER INPUT REQUIRED

65 of 338 rendered stops (19.2%) across
23 of 34 tours fall back to the generic sentence.
These are the placeholders a visitor actually reads.

The fallback happens because `getActivitySummary()` matches on the exact lowercased title and
only ~28 attractions have approved text. Two different problems are mixed together here:

**(a) Naming variants of attractions that already have approved text — FIXED.** The lookup is
an exact string match, so a trivial rewording silently lost its description. The 13 reworded
titles below are now aliased in `src/utils/tourContent.ts` (`attractionAliases`) to the
approved entry they duplicate — no new copy was written, and they no longer hit the fallback:

| Rendered title | Resolves to |
|---|---|
| Valley Temple | `the valley temple` |
| The Great Pyramid of Khufu | `the great pyramid` |
| Great Pyramid of Khufu | `the great pyramid` |
| Sphinx | `the great sphinx` |
| Great Sphinx | `the great sphinx` |
| The Sphinx of Chephren | `the great sphinx` |
| Egyptian Museum | `the egyptian museum` |
| Khan El Khalili | `khan el khalili bazaar` |
| High Dam | `the high dam` |
| Unfinished Obelisk | `the unfinished obelisk` |
| Step Pyramid of Djoser | `saqqara step pyramid` |
| The Fascinating Valley of the Kings | `valley of the kings` |
| Giza Pyramids | `giza pyramids complex` |

Note: `Luxor Temple by Night` (3 occurrences, two spellings) is deliberately **not** aliased.
It is a distinct evening experience and must not inherit the daytime text.

The fallback sentence itself was also generalized from "Visit X as part of…" to "X is included
as part of the planned itinerary…", so non-place stop titles (e.g. "Optional camel ride",
"Desert safari") no longer render with a mismatched verb. It still contains the phrase the
audit uses to detect generic copy, so the count below stays honest.

**(b) Attractions with no approved text at all.** These need owner-approved copy. They are
concentrated in Alexandria, Islamic and Coptic Cairo, Luxor temple features, the Dahshur and
White Desert sites, and the Red Sea resort activities:

| Rendered title | Tours |
|---|---|
| Qaitbay Citadel | 4 |
| Ben Ezra Synagogue | 3 |
| Catacombs of Kom El Shoqafa | 3 |
| Pompey's Pillar | 3 |
| Alexandria Library | 3 |
| Luxor Temple by Night | 2 |
| The Hanging Church | 2 |
| Amr Ibn Al Aas Mosque | 2 |
| Luxor Temple By Night | 1 |
| Sultan Hassan Mosque | 1 |
| Al Rifai Mosque | 1 |
| The Catacombs | 1 |
| Optional camel ride | 1 |
| Great Temple of Ramses II | 1 |
| Temple of Nefertari | 1 |
| UNESCO rescue site | 1 |
| Bibliotheca Alexandrina | 1 |
| Hanging Church | 1 |
| Coptic Museum | 1 |
| Giftun Island snorkeling | 1 |
| Red Sea coral reefs | 1 |
| Ras Mohammed National Park | 1 |
| Desert safari | 1 |
| Red Sea beaches | 1 |
| Sataya Dolphin Reef | 1 |
| Samadai coral walls | 1 |
| Lagoon boat trip | 1 |
| Island snorkeling | 1 |
| House-reef snorkeling | 1 |
| Semi-submarine coral tour | 1 |
| Tobia Islands snorkeling | 1 |
| Kitesurfing | 1 |
| Marina coral safari | 1 |
| Snorkeling lagoons | 1 |
| Memphis | 1 |
| Dahshur Pyramids | 1 |
| Bent Pyramid | 1 |
| Red Pyramid | 1 |
| Tutankhamun treasures | 1 |
| Royal Mummies Hall | 1 |
| White Desert chalk formations | 1 |
| Crystal Mountain | 1 |
| Black Desert | 1 |
| Kiosk of Trajan | 1 |
| Royal tombs | 1 |
| Tomb of Tutankhamun | 1 |
| Great Hypostyle Hall | 1 |
| Avenue of Sphinxes | 1 |
| Sacred Lake | 1 |
| Traditional felucca sail | 1 |
| Nile sunset | 1 |

### A4. Empty arrays

- `SAMPLE_BLOG_POSTS` now contains 5 published articles
  (declared in `src/blogPosts.ts`, re-exported from `constants.ts`). The blog is public,
  indexable, in the sitemap, and linked from navigation and the footer.
- No tour has an empty `inclusions`, `exclusions`, `gallery`, `highlights` or `itinerary` array.

### A5. Ratings and review counts — REMOVED

Every tour previously carried `rating` (4.5–4.9) and `reviewsCount` (48–412), which were
unsubstantiated and never rendered. The fields are now removed from the `Tour` interface and
every tour record, along with the dead `Review` interface and `reviewsList` field — no
component can surface them again without a schema change.

- `scripts/phase6-seo.ts` still forbids `AggregateRating`, `Review`, `Offer`, `Product` and
  `IndividualProduct` schema types, and no rating markup exists in the built output.
- The JSON-LD test suite asserts no prices, ratings, reviews, or offers appear in the
  `TouristTrip`/`BreadcrumbList` markup for any tour.

If the owner later gathers genuine review evidence, ratings can be reintroduced deliberately.

### A6. Currency — FORMAT UNIFIED; THE CURRENCY ITSELF IS AN OWNER DECISION

`Tour.price` is a bare number and no currency field exists. Every surface now renders through
`formatUsd()` in `src/utils/money.ts`, which produces `US$` with a thousands separator:

| Surface | Source | Renders as |
|---|---|---|
| Tours listing — day-tour table & card badge | `Tours.tsx` | `US$1,070` |
| Tours listing — grid/list cards & price filter | `Tours.tsx` | `US$1,070` |
| Tour detail — badge, sidebar, price section, related cards | `TourDetails.tsx` | `US$1,070` |
| Home — featured cards | `Home.tsx` | `US$1,070` |

`US$` was chosen over bare `$` because it is unambiguous internationally — Egypt’s local
currency is the Egyptian pound. What still needs owner confirmation is the currency itself:
whether to keep USD estimates, switch to EGP, or add a per-tour currency field. That decision
is now a one-function change.

### A7. Phone number — CONSISTENT

`CONTACT_PHONE = '+201028838866'` in `src/config/site.ts` is the single source of truth.
A repo-wide search for hardcoded phone literals outside that file returns **zero** matches.
Every surface (Navbar, Footer, Contact, Home JSON-LD, TourDetails, WhatsApp links) derives from
the constant, and displays `(+20) 102 883 8866` for readability.

### A8. Contact email — SUPPRESSED UNTIL THE MAILBOX WORKS

`info@travisiontours.com` appears in seven places: Navbar, Footer, Contact, Home (JSON-LD),
Policies, and TourDetails (×2). The plan requires it not be published until the domain
and mailbox work, so all seven are now gated on `EMAIL_PUBLISHED` in
`src/config/business.ts` (currently `false`). While the flag is off, Policies instead
points at the inquiry form and phone number, and the JSON-LD Organization object omits
the `email` field entirely. Flipping the flag restores every site at once once the
owner confirms the mailbox is live.

### A9. Policy version — CENTRALIZED

`INQUIRY_POLICY_VERSION = '2026-08-13'` and `PAYMENT_PARTNER_NAME` are declared
once, in `src/config/business.ts`. `src/config/site.ts` re-exports them for the browser bundle
and `worker/index.ts` imports the same module, so the version the site displays and the
version written into `bookings.inquiry_policy_version` can no longer drift, and the Worker's
response message interpolates the partner name instead of hardcoding it.

The client still does not send the version it displayed — the Worker stamps the version it
holds. Since both sides share one constant, they can only disagree if a stale pre-deploy
bundle is served after a release, which is a caching concern rather than a drift vector.

### A10. Cross-tour repeated boilerplate — PARTIALLY SUPERSEDED

The following values are byte-identical in the raw tour records, because a one-off
cleanup script (`scripts/sanitize-tour-data.mjs`, not part of the build) overwrote the scraped
copy. They are legally safe but carry no tour-specific information:

- **Inclusions** — 2 distinct value across 34 tour records.
- **Exclusions** — 2 distinct value across 34 tour records.
- **Meals** — 1 distinct value across all itinerary days.
- **Accommodation** — 3 distinct value across all itinerary days.

Since the head-company pass, the tour page renders sourced inclusion/exclusion lists from
`src/tourPolicies.ts` where a verified source page exists — currently 13 tours with
sourced inclusions and 12 with sourced exclusions (see Section B). Tours without a
source mapping keep the generic lists, which read as placeholders rather than claims.

Raw-record inclusions (identical for every tour record):

- Services itemized as included in your written quotation.
- Transport, accommodation, meals, guides, and admission tickets only when specifically listed.
- Applicable taxes or service charges only when stated in the accepted quotation.

Exclusions (identical for every tour):

- International flights, visas, travel insurance, and personal expenses unless specifically listed.
- Optional activities, gratuities, and services not identified as included.
- Payment-provider, bank, or currency-conversion charges unless specifically included.

### A11. Highlight entries — minor inconsistency

Five of the 78 `highlights` entries end with a period while the rest do not, and one is a
scraped prose fragment rather than a sight:

| Tour | Highlight | Note |
|---|---|---|
| `pyramids-tour-from-cairo-airport` | "Sphinx — no hotel stay required." | prose fragment fused with a note |
| `day-trip-to-giza-pyramids-from-cairo` | "optional camel ride." | inconsistent trailing period |
| `tour-to-giza-pyramids-old-cairo` | "Khan El Khalili." | inconsistent trailing period |
| `8-days-budget-egypt-complete-tour` | "Hurghada option." | inconsistent trailing period |
| `12-days-family-egypt-red-sea-holiday` | "family entertainment." | inconsistent trailing period |

These are cosmetic and left unchanged: choosing the corrected wording is an editorial
decision, not a defect the implementer should resolve unilaterally.

---

## Section B — Per-tour validation sheet

Since the head-company pass, per-tour logistics are modelled in `src/tourPolicies.ts`
(`TOUR_LOGISTICS`, `PACKAGE_ACCOMMODATION`), sourced from Egypt Online Tour pages and traced in
`HEAD_COMPANY_SOURCE_MATRIX.md`. Coverage by match strength:

| Match | Tours | What is shown |
|---|---|---|
| `exact` — same route/duration/type on a source page | 11 | Sourced pickup, availability, basis, guide, transport, inclusions/exclusions |
| `partial`/`category` — overlapping scope or category pattern only | 11 | Shared facts only, labelled as the partner's standard arrangements |
| unmapped — no reliable source page | 12 | Fallback wording; confirmed in the written quotation |

| Field | Status |
|---|---|
| Pickup / drop-off | Sourced where a matching source page states it; otherwise "confirmed in your written quotation" |
| Accessibility / physical requirements | Sourced notes on mapped tours (pyramid interiors, desert terrain, tomb stairs); otherwise general guidance only |
| Availability | "Daily" on mapped day tours where the source page states it; otherwise on request |
| Hotel / accommodation level | Sourced night-by-night detail on 2 packages; category-level tier wording elsewhere; named properties never promised |
| Cancellation terms | Partner standard schedule published on /policies; final tour-specific terms stay in the written quotation |

In the per-tour sections, `Days` counts itinerary days, `Stops` counts rendered stops, and
`generic` counts stops falling back to placeholder copy (see §A3).

| # | Tour | Slug | Days | Duration | Stops | generic | Price | Cover | Gallery |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Pyramids Tour from Cairo Airport | `pyramids-tour-from-cairo-airport` | 1 | 1 Day | 6 | 0 | 100 | `/images/tours/pyramids-tour-from-cairo-airport/gallery-1.jpeg` | 2 |
| 2 | Day Trip to Pyramids from Cairo | `day-trip-to-giza-pyramids-from-cairo` | 1 | 1 Day | 6 | 0 | 80 | `/images/tours/day-trip-to-giza-pyramids-from-cairo/gallery-1.jpeg` | 2 |
| 3 | Tour to Giza Pyramids & Old Cairo | `tour-to-giza-pyramids-old-cairo` | 1 | 1 Day | 8 | 0 | 70 | `/images/tours/tour-to-giza-pyramids-old-cairo/gallery-1.jpeg` | 6 |
| 4 | Giza Pyramids and Old Cairo Private Tour | `4-days-cairo-giza-pyramids-tour` | 4 | 4 Days / 3 Nights | 18 | 0 | 370 | `/images/tours/4-days-cairo-giza-pyramids-tour/gallery-3.jpeg` | 6 |
| 5 | Cairo, Abu Simbel, and Luxor Private Tour | `pkg-7-5-days-cairo--luxor---abu-simbel-tour` | 5 | 5 Days / 4 Nights | 19 | 0 | 960 | `/images/tours/pkg-7-5-days-cairo--luxor---abu-simbel-tour/gallery-1.jpeg` | 8 |
| 6 | Cairo, Luxor, Aswan, and Abu Simbel Guided Tour | `6-days-cairo-luxor-aswan` | 6 | 6 Days / 5 Nights | 23 | 0 | 1070 | `/images/tours/6-days-cairo-luxor-aswan/gallery-1.jpeg` | 8 |
| 7 | Cairo and Upper Egypt with Edfu & Kom Ombo Tour | `7-days-cairo-luxor-aswan-abu-simbel-edfu-kom-ombo` | 7 | 7 Days / 6 Nights | 28 | 0 | 1140 | `/images/tours/7-days-cairo-luxor-aswan-abu-simbel-edfu-kom-ombo/gallery-3.jpeg` | 8 |
| 8 | Private Tour to Cairo, Giza Pyramids & Nile Cruise | `8-days-budget-egypt-complete-tour` | 8 | 8 Days / 7 Nights | 23 | 1 | 1200 | `/images/tours/8-days-budget-egypt-complete-tour/gallery-1.jpeg` | 8 |
| 9 | Cairo, Alexandria, Luxor, and Aswan Private Trip | `9-days-cairo-alexandria-luxor-aswan-trip` | 9 | 9 Days / 8 Nights | 39 | 8 | 1370 | `/images/tours/9-days-cairo-alexandria-luxor-aswan-trip/gallery-1.jpeg` | 8 |
| 10 | Cairo, Nile Cruise, and Hurghada Vacation | `12-days-family-egypt-red-sea-holiday` | 12 | 12 Days / 11 Nights | 28 | 0 | 1740 | `/images/tours/12-days-family-egypt-red-sea-holiday/gallery-1.jpeg` | 8 |
| 11 | Marvelous of Egypt Pyramids Tour | `14-days-trip-to-the-best-of-egypt` | 14 | 14 Days / 13 Nights | 44 | 10 | 1920 | `/images/tours/14-days-trip-to-the-best-of-egypt/gallery-1.jpeg` | 10 |
| 12 | Best of Egypt Private Tour | `15-days-marvelous-egypt-tour-package` | 15 | 15 Days / 14 Nights | 39 | 4 | 1930 | `/images/tours/15-days-marvelous-egypt-tour-package/gallery-1.jpeg` | 10 |
| 13 | Cairo Day Tour | `cairo-day-tour` | 1 | 1 Day | 3 | 0 | 85 | `/images/day-tours/cairo-day-tour.jpeg` | 0 |
| 14 | Giza Pyramids Day Tour | `giza-pyramids-day-tour` | 1 | 1 Day | 4 | 1 | 75 | `/images/day-tours/giza-pyramids-day-tour.jpeg` | 0 |
| 15 | Luxor Day Tour | `luxor-day-tour` | 1 | 1 Day | 3 | 0 | 110 | `/images/day-tours/luxor-day-tour.jpeg` | 0 |
| 16 | Aswan Day Tour | `aswan-day-tour` | 1 | 1 Day | 3 | 0 | 95 | `/images/day-tours/aswan-day-tour.jpeg` | 0 |
| 17 | Abu Simbel Day Tour | `abu-simbel-day-tour` | 1 | 1 Day | 3 | 3 | 165 | `/images/day-tours/abu-simbel-day-tour.jpeg` | 0 |
| 18 | Alexandria Day Tour | `alexandria-day-tour` | 1 | 1 Day | 3 | 3 | 120 | `/images/day-tours/alexandria-day-tour.jpeg` | 0 |
| 19 | Old Cairo Day Tour | `old-cairo-day-tour` | 1 | 1 Day | 4 | 3 | 70 | `/images/day-tours/old-cairo-day-tour.jpeg` | 0 |
| 20 | Hurghada Day Tour | `hurghada-day-tour` | 1 | 1 Day | 2 | 2 | 90 | `/images/day-tours/hurghada-day-tour.jpeg` | 0 |
| 21 | Sharm El Sheikh Day Tour | `sharm-el-sheikh-day-tour` | 1 | 1 Day | 3 | 3 | 95 | `/images/day-tours/sharm-el-sheikh-day-tour.jpeg` | 0 |
| 22 | Marsa Alam Day Tour | `marsa-alam-day-tour` | 1 | 1 Day | 2 | 2 | 100 | `/images/day-tours/marsa-alam-day-tour.jpeg` | 0 |
| 23 | El Gouna Day Tour | `el-gouna-day-tour` | 1 | 1 Day | 2 | 2 | 85 | `/images/day-tours/el-gouna-day-tour.jpeg` | 0 |
| 24 | Makadi Bay Day Tour | `makadi-bay-day-tour` | 1 | 1 Day | 2 | 2 | 80 | `/images/day-tours/makadi-bay-day-tour.jpeg` | 0 |
| 25 | Soma Bay Day Tour | `soma-bay-day-tour` | 1 | 1 Day | 2 | 2 | 90 | `/images/day-tours/soma-bay-day-tour.jpeg` | 0 |
| 26 | Port Ghalib Day Tour | `port-ghalib-day-tour` | 1 | 1 Day | 2 | 2 | 95 | `/images/day-tours/port-ghalib-day-tour.jpeg` | 0 |
| 27 | Sakkara & Memphis Day Tour | `sakkara-day-tour` | 1 | 1 Day | 3 | 2 | 70 | `/images/day-tours/sakkara-day-tour.jpeg` | 0 |
| 28 | Dahshur Pyramids Day Tour | `dahshur-day-tour` | 1 | 1 Day | 2 | 2 | 65 | `/images/day-tours/dahshur-day-tour.jpeg` | 0 |
| 29 | Egyptian Museum Day Tour | `egyptian-museum-day-tour` | 1 | 1 Day | 2 | 2 | 55 | `/images/day-tours/egyptian-museum-day-tour.jpeg` | 0 |
| 30 | White Desert Day Tour | `white-desert-day-tour` | 1 | 1 Day | 3 | 3 | 130 | `/images/day-tours/white-desert-day-tour.jpeg` | 0 |
| 31 | Philae Temple Day Tour | `philae-temple-day-tour` | 1 | 1 Day | 2 | 1 | 60 | `/images/day-tours/philae-temple-day-tour.jpeg` | 0 |
| 32 | Valley of the Kings Day Tour | `valley-of-kings-day-tour` | 1 | 1 Day | 2 | 2 | 75 | `/images/day-tours/valley-of-kings-day-tour.jpeg` | 0 |
| 33 | Karnak Temple Day Tour | `karnak-temple-day-tour` | 1 | 1 Day | 3 | 3 | 65 | `/images/day-tours/karnak-temple-day-tour.jpeg` | 0 |
| 34 | Nile Felucca Day Tour | `nile-cruise-day-tour` | 1 | 1 Day | 2 | 2 | 50 | `/images/day-tours/nile-cruise-day-tour.jpeg` | 0 |

### Per-tour detail

#### 1. Pyramids Tour from Cairo Airport

- **Slug:** `pyramids-tour-from-cairo-airport`
- **Category / location:** cultural · Cairo
- **Duration:** 1 Day (1 itinerary day)
- **Starting price:** 100 — currency unconfirmed, see §A6
- **Cover image:** `/images/tours/pyramids-tour-from-cairo-airport/gallery-1.jpeg`
- **Gallery:** 2 image(s)
- **Map:** `https://www.google.com/maps/embed?pb=!1m40!1m12!1m3!1d221185…`
- **Highlights:** Giza Pyramids; Sphinx — no hotel stay required.
- **Inclusions:** sourced from the matched partner page — Airport pickup and return transfers in a private air-conditioned vehicle; English-speaking Egyptologist guide; Admission tickets to the listed attractions; Applicable taxes and service charges
- **Exclusions:** sourced from the matched partner page — Egypt entry visa; Personal expenses and gratuities; Anything not listed as included
- **Source match:** `exact` — https://egyptonlinetour.com/tours/cairo-layover-tour
- **Pickup / drop-off:** Pickup and drop-off at Cairo International Airport
- **Availability:** Daily — arranged around your flight schedule
- **Accommodation level:** no overnight stay on this itinerary
- **Cancellation / policy version:** global `2026-08-13`; partner standard schedule on /policies; tour-specific terms in the written quotation

**Destinations and stops as rendered:**

- **Day 1 — Tour Itinerary: Day Tour to Pyramids from Cairo Airport**
  - Summary: This part of Pyramids Tour from Cairo Airport is planned around tour itinerary: day tour to pyramids from cairo airport. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Giza Pyramids Complex
  - The Great Pyramid
  - The Great Sphinx
  - The Valley Temple
  - The Grand Egyptian Museum
  - Lunch Time

_Summary line rendered on cards:_ Explore Cairo on this 1 day cultural itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services. Planned highlights include Giza Pyramids, Sphinx — no hotel stay required.

#### 2. Day Trip to Pyramids from Cairo

- **Slug:** `day-trip-to-giza-pyramids-from-cairo`
- **Category / location:** cultural · Cairo, Giza
- **Duration:** 1 Day (1 itinerary day)
- **Starting price:** 80 — currency unconfirmed, see §A6
- **Cover image:** `/images/tours/day-trip-to-giza-pyramids-from-cairo/gallery-1.jpeg`
- **Gallery:** 2 image(s)
- **Map:** `https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d55274.…`
- **Highlights:** Great Pyramid; Sphinx; Valley Temple; optional camel ride.
- **Inclusions:** sourced from the matched partner page — Hotel pickup and drop-off; Private air-conditioned transport; Professional Egyptology guide; Admission fees for the itinerary attractions; Applicable taxes and service charges
- **Exclusions:** sourced from the matched partner page — Egypt entry visa; Personal expenses and optional purchases; Tips and gratuities
- **Source match:** `exact` — https://egyptonlinetour.com/tours/pyramids-and-saqqara-day-tour-in-cairo
- **Pickup / drop-off:** Hotel pickup and drop-off in Cairo
- **Availability:** Daily
- **Accommodation level:** no overnight stay on this itinerary
- **Cancellation / policy version:** global `2026-08-13`; partner standard schedule on /policies; tour-specific terms in the written quotation

**Destinations and stops as rendered:**

- **Day 1 — Tour Itinerary: Day Trip to Pyramids from Cairo**
  - Summary: This part of Day Trip to Pyramids from Cairo is planned around tour itinerary: day trip to pyramids from cairo. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Giza Pyramids Complex
  - The Great Pyramid
  - The Great Sphinx
  - The Valley Temple
  - Lunch Time
  - Saqqara Step Pyramid

_Summary line rendered on cards:_ Explore Cairo, Giza on this 1 day cultural itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services. Planned highlights include Great Pyramid, Sphinx, Valley Temple.

#### 3. Tour to Giza Pyramids & Old Cairo

- **Slug:** `tour-to-giza-pyramids-old-cairo`
- **Category / location:** historical · Cairo, Giza
- **Duration:** 1 Day (1 itinerary day)
- **Starting price:** 70 — currency unconfirmed, see §A6
- **Cover image:** `/images/tours/tour-to-giza-pyramids-old-cairo/gallery-1.jpeg`
- **Gallery:** 6 image(s)
- **Map:** `https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d55273.…`
- **Highlights:** Pyramids; Sphinx; Hanging Church; Khan El Khalili.
- **Inclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Exclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Source match:** `category` — https://egyptonlinetour.com/tours/exciting-private-day-trip-of-giza
- **Pickup / drop-off:** Hotel pickup and drop-off in Cairo or Giza
- **Availability:** Daily
- **Accommodation level:** no overnight stay on this itinerary
- **Cancellation / policy version:** global `2026-08-13`; partner standard schedule on /policies; tour-specific terms in the written quotation

**Destinations and stops as rendered:**

- **Day 1 — Tour Itinerary: Day Tour in Cairo**
  - Summary: This part of Tour to Giza Pyramids & Old Cairo is planned around tour itinerary: day tour in cairo. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Giza Pyramids Complex
  - The Great Pyramid
  - The Great Sphinx
  - The Valley Temple
  - Lunch Time
  - The Egyptian Museum
  - Al Muizz Street
  - Khan El Khalili Bazaar

_Summary line rendered on cards:_ Explore Cairo, Giza on this 1 day historical itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services. Planned highlights include Pyramids, Sphinx, Hanging Church.

#### 4. Giza Pyramids and Old Cairo Private Tour

- **Slug:** `4-days-cairo-giza-pyramids-tour`
- **Category / location:** cultural · Cairo, Giza
- **Duration:** 4 Days / 3 Nights (4 itinerary days)
- **Starting price:** 370 — currency unconfirmed, see §A6
- **Cover image:** `/images/tours/4-days-cairo-giza-pyramids-tour/gallery-3.jpeg`
- **Gallery:** 6 image(s)
- **Map:** `https://www.google.com/maps/embed?pb=!1m48!1m8!1m3!1d442323.…`
- **Highlights:** _not present in the data model_
- **Inclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Exclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Source match:** unmapped — no reliable source page; fallback wording shown
- **Pickup / drop-off:** ⚠️ **OWNER INPUT REQUIRED** — confirmed in the written quotation
- **Availability:** on request — confirmed in the written quotation
- **Accommodation level:** renders "Accommodation to be confirmed" — tier and properties confirmed in the written quotation
- **Cancellation / policy version:** global `2026-08-13`; partner standard schedule on /policies; tour-specific terms in the written quotation

**Destinations and stops as rendered:**

- **Day 1 — Arrival to Cairo Airport**
  - Summary: This part of Giza Pyramids and Old Cairo Private Tour is planned around arrival to cairo airport. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Dinner Time
  - Overnight
- **Day 2 — Tour to the Egyptian Pyramids**
  - Summary: This part of Giza Pyramids and Old Cairo Private Tour is planned around tour to the egyptian pyramids. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Giza Pyramids Complex
  - The Great Pyramid
  - The Great Sphinx
  - The Valley Temple
  - The Grand Egyptian Museum
  - Lunch Time
  - Saqqara Step Pyramid
  - Overnight
- **Day 3 — Tour to Cairo Old Attractions**
  - Summary: This part of Giza Pyramids and Old Cairo Private Tour is planned around tour to cairo old attractions. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - The Egyptian Museum
  - Lunch Time
  - Salah El Din Citadel
  - Mohamed Ali Mosque
  - The National Museum of Egyptian Civilization
  - Al Muizz Street
  - Khan El Khalili Bazaar
  - Overnight
- **Day 4 — End Your Cairo Tour Packages**
  - Summary: This part of Giza Pyramids and Old Cairo Private Tour is planned around end your cairo tour packages. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation

_Summary line rendered on cards:_ Explore Cairo, Giza on this 4 days / 3 nights cultural itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services.

#### 5. Cairo, Abu Simbel, and Luxor Private Tour

- **Slug:** `pkg-7-5-days-cairo--luxor---abu-simbel-tour`
- **Category / location:** historical · Cairo, Luxor, Abu Simbel
- **Duration:** 5 Days / 4 Nights (5 itinerary days)
- **Starting price:** 960 — currency unconfirmed, see §A6
- **Cover image:** `/images/tours/pkg-7-5-days-cairo--luxor---abu-simbel-tour/gallery-1.jpeg`
- **Gallery:** 8 image(s)
- **Map:** `https://www.google.com/maps/embed?pb=!1m36!1m8!1m3!1d1466441…`
- **Highlights:** _not present in the data model_
- **Inclusions:** sourced from the matched partner page — Airport meet-and-assist and private transfers; Domestic flights (Cairo–Aswan and Luxor–Cairo); First-class train between Aswan and Luxor; Private Egyptologist-guided sightseeing; Entry fees for the listed sites; Breakfast box for the early Abu Simbel departure when needed
- **Exclusions:** sourced from the matched partner page — International flights; Egypt entry visa; Travel insurance; Tips and personal expenses; Entry inside the Great Pyramid and special tomb tickets; Early hotel check-in or late check-out
- **Source match:** `exact` — https://egyptonlinetour.com/tours/5-days-cairo-luxor-abu-simbel-tour
- **Pickup / drop-off:** Airport meet-and-assist on arrival, with private transfers throughout
- **Availability:** on request — confirmed in the written quotation
- **Sourced notes:** The Abu Simbel day starts before sunrise — the temples are several hours by road each way from Aswan. · Pyramid interiors have narrow, steep, warm passages — flag mobility, breathing, or claustrophobia concerns before requesting interior tickets.
- **Accommodation level:** renders "Accommodation to be confirmed" — tier and properties confirmed in the written quotation
- **Cancellation / policy version:** global `2026-08-13`; partner standard schedule on /policies; tour-specific terms in the written quotation

**Destinations and stops as rendered:**

- **Day 1 — Arrival to Egypt the Land of Pharaohs**
  - Summary: This part of Cairo, Abu Simbel, and Luxor Private Tour is planned around arrival to egypt the land of pharaohs. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Dinner Time
  - Overnight
- **Day 2 — Tour to the Pyramids and the Egyptian Museum**
  - Summary: This part of Cairo, Abu Simbel, and Luxor Private Tour is planned around tour to the pyramids and the egyptian museum. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Giza Pyramids Complex
  - The Great Pyramid
  - The Great Sphinx
  - The Valley Temple
  - The Grand Egyptian Museum
  - Lunch Time
  - The Egyptian Museum
  - Overnight
- **Day 3 — Tour to The Temples of Abu Simbel**
  - Summary: This part of Cairo, Abu Simbel, and Luxor Private Tour is planned around tour to the temples of abu simbel. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - The Impressive Two Temples of Abu Simbel
  - Lunch Time
  - Overnight
- **Day 4 — Explore Luxor Famous Attractions**
  - Summary: This part of Cairo, Abu Simbel, and Luxor Private Tour is planned around explore luxor famous attractions. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Valley of the Kings
  - Hatshepsut Temple
  - Colossi of Memnon
  - Lunch Time
  - Karnak Temple
  - Overnight
- **Day 5 — End of Your Cairo, Luxor & Abu Simbel Tour**
  - Summary: This part of Cairo, Abu Simbel, and Luxor Private Tour is planned around end of your cairo, luxor & abu simbel tour. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation

_Summary line rendered on cards:_ Explore Cairo, Luxor, Abu Simbel on this 5 days / 4 nights historical itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services.

#### 6. Cairo, Luxor, Aswan, and Abu Simbel Guided Tour

- **Slug:** `6-days-cairo-luxor-aswan`
- **Category / location:** historical · Cairo, Luxor, Aswan
- **Duration:** 6 Days / 5 Nights (6 itinerary days)
- **Starting price:** 1070 — currency unconfirmed, see §A6
- **Cover image:** `/images/tours/6-days-cairo-luxor-aswan/gallery-1.jpeg`
- **Gallery:** 8 image(s)
- **Map:** `https://www.google.com/maps/embed?pb=!1m42!1m8!1m3!1d1466441…`
- **Highlights:** _not present in the data model_
- **Inclusions:** sourced from the matched partner page — Meet-and-assist service at Cairo International Airport; Private airport arrival and departure transfers; Domestic flights (Cairo–Luxor and Aswan–Cairo); First-class train ticket between Luxor and Aswan; Private tours with licensed Egyptologists; Standard entrance fees for the listed sites; Private round-trip transportation between Aswan and Abu Simbel; Motorboat crossing in Luxor and motorboat transfer to Philae Temple; Nile dinner cruise in Cairo; Daily hotel breakfast and lunch on the listed sightseeing days; Breakfast box for early departures when needed; Service charges, applicable taxes, and local support during the tour
- **Exclusions:** sourced from the matched partner page — International flights; Egypt entry visa; Travel insurance; Drinks during meals; Optional tours; Personal expenses; Entry inside the Great Pyramid and special tomb tickets in the Valley of the Kings; Early hotel check-in and late check-out; Tips and gratuities
- **Source match:** `exact` — https://egyptonlinetour.com/tours/6-days-cairo-luxor-aswan-abu-simbel-package
- **Pickup / drop-off:** Meet-and-assist at Cairo International Airport; private airport transfers throughout
- **Availability:** on request — confirmed in the written quotation
- **Sourced notes:** Share any food allergy, vegetarian request, or child meal need before booking. · The Valley of the Kings standard ticket covers selected open tombs; special tombs require separate tickets.
- **Accommodation level:** sourced — Five-star hotel accommodation throughout: two nights in Cairo, two nights in Luxor, and one night in Aswan, with daily hotel breakfast. (https://egyptonlinetour.com/tours/6-days-cairo-luxor-aswan-abu-simbel-package)
- **Cancellation / policy version:** global `2026-08-13`; partner standard schedule on /policies; tour-specific terms in the written quotation

**Destinations and stops as rendered:**

- **Day 1 — Arrival to Egypt Land of Pharaohs**
  - Summary: This part of Cairo, Luxor, Aswan, and Abu Simbel Guided Tour is planned around arrival to egypt land of pharaohs. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Dinner Time
  - Overnight
- **Day 2 — Tour to Giza Pyramids & The Egyptian Museum**
  - Summary: This part of Cairo, Luxor, Aswan, and Abu Simbel Guided Tour is planned around tour to giza pyramids & the egyptian museum. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Giza Pyramids Complex
  - The Great Pyramid
  - The Great Sphinx
  - The Valley Temple
  - Lunch Time
  - The Grand Egyptian Museum
  - Overnight
- **Day 3 — Tour to Luxor East & West Attractions**
  - Summary: This part of Cairo, Luxor, Aswan, and Abu Simbel Guided Tour is planned around tour to luxor east & west attractions. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Valley of the Kings
  - Queen Hatshepsut Temple
  - Colossi of Memnon
  - Lunch Time
  - Karnak Temple
  - Overnight
- **Day 4 — Transfer to Aswan by Train - Tour to Aswan Landmarks**
  - Summary: This part of Cairo, Luxor, Aswan, and Abu Simbel Guided Tour is planned around transfer to aswan by train - tour to aswan landmarks. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - The High Dam
  - The Unfinished Obelisk
  - Lunch Time
  - Philae Temple
  - Overnight
- **Day 5 — Tour to the Two Temples of Abu Simbel + Fly Back to Cairo**
  - Summary: This part of Cairo, Luxor, Aswan, and Abu Simbel Guided Tour is planned around tour to the two temples of abu simbel + fly back to cairo. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Abu Simbel Temples
  - Lunch Time
  - Overnight
- **Day 6 — End of Cairo, Luxor, Aswan & Abu Simbel Package**
  - Summary: This part of Cairo, Luxor, Aswan, and Abu Simbel Guided Tour is planned around end of cairo, luxor, aswan & abu simbel package. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation

_Summary line rendered on cards:_ Explore Cairo, Luxor, Aswan on this 6 days / 5 nights historical itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services.

#### 7. Cairo and Upper Egypt with Edfu & Kom Ombo Tour

- **Slug:** `7-days-cairo-luxor-aswan-abu-simbel-edfu-kom-ombo`
- **Category / location:** historical · Cairo, Luxor, Aswan, Abu Simbel
- **Duration:** 7 Days / 6 Nights (7 itinerary days)
- **Starting price:** 1140 — currency unconfirmed, see §A6
- **Cover image:** `/images/tours/7-days-cairo-luxor-aswan-abu-simbel-edfu-kom-ombo/gallery-3.jpeg`
- **Gallery:** 8 image(s)
- **Map:** `https://www.google.com/maps/embed?pb=!1m36!1m8!1m3!1d7278264…`
- **Highlights:** _not present in the data model_
- **Inclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Exclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Source match:** unmapped — no reliable source page; fallback wording shown
- **Pickup / drop-off:** ⚠️ **OWNER INPUT REQUIRED** — confirmed in the written quotation
- **Availability:** on request — confirmed in the written quotation
- **Accommodation level:** renders "Accommodation to be confirmed" — tier and properties confirmed in the written quotation
- **Cancellation / policy version:** global `2026-08-13`; partner standard schedule on /policies; tour-specific terms in the written quotation

**Destinations and stops as rendered:**

- **Day 1 — Arrival to Egypt Land of Pharaohs**
  - Summary: This part of Cairo and Upper Egypt with Edfu & Kom Ombo Tour is planned around arrival to egypt land of pharaohs. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Dinner Time
  - Overnight
- **Day 2 — Tour to Giza Pyramids & The Egyptian Museum**
  - Summary: This part of Cairo and Upper Egypt with Edfu & Kom Ombo Tour is planned around tour to giza pyramids & the egyptian museum. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Giza Pyramids Complex
  - The Great Pyramid
  - The Great Sphinx
  - The Valley Temple
  - The Grand Egyptian Museum
  - Lunch Time
  - The Egyptian Museum
  - Overnight
- **Day 3 — Tour to Luxor Attractions**
  - Summary: This part of Cairo and Upper Egypt with Edfu & Kom Ombo Tour is planned around tour to luxor attractions. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Valley of the Kings
  - Hatshepsut Temple
  - Colossi of Memnon
  - Lunch Time
  - Karnak Temple
  - Overnight
- **Day 4 — Tour to Edfu and Kom Ombo Temples**
  - Summary: This part of Cairo and Upper Egypt with Edfu & Kom Ombo Tour is planned around tour to edfu and kom ombo temples. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Edfu temple
  - Kom Ombo Temple
  - Lunch Time
  - Overnight
- **Day 5 — Tour to the Two Temples of Abu Simbel**
  - Summary: This part of Cairo and Upper Egypt with Edfu & Kom Ombo Tour is planned around tour to the two temples of abu simbel. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Abu Simbel Temples
  - Lunch Time
  - Overnight
- **Day 6 — Tour to Aswan Attractions**
  - Summary: This part of Cairo and Upper Egypt with Edfu & Kom Ombo Tour is planned around tour to aswan attractions. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - The High Dam
  - The Unfinished Obelisk
  - Philae Temple
  - Lunch Time
  - Overnight
- **Day 7 — End of the 7 Days Experience Egypt Tour**
  - Summary: This part of Cairo and Upper Egypt with Edfu & Kom Ombo Tour is planned around end of the 7 days experience egypt tour. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation

_Summary line rendered on cards:_ Explore Cairo, Luxor, Aswan, Abu Simbel on this 7 days / 6 nights historical itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services.

#### 8. Private Tour to Cairo, Giza Pyramids & Nile Cruise

- **Slug:** `8-days-budget-egypt-complete-tour`
- **Category / location:** adventure · Cairo, Luxor, Aswan
- **Duration:** 8 Days / 7 Nights (8 itinerary days)
- **Starting price:** 1200 — currency unconfirmed, see §A6
- **Cover image:** `/images/tours/8-days-budget-egypt-complete-tour/gallery-1.jpeg`
- **Gallery:** 8 image(s)
- **Map:** `https://www.google.com/maps/embed?pb=!1m54!1m8!1m3!1d1466007…`
- **Highlights:** Pyramids; Nile Valley temples; Abu Simbel; Aswan; Hurghada option.
- **Inclusions:** sourced from the matched partner page — Airport meet-and-greet and all transfers in private air-conditioned vehicles; EgyptAir domestic flight tickets between Cairo, Luxor, and Aswan; Admission costs for the sites in the itinerary; Private sightseeing in Cairo and the scheduled cruise excursions; An English-speaking guide while travelling; Meals as specified in the schedule; One bottle of water per person each day; Portage when necessary, plus all taxes and service fees
- **Exclusions:** sourced from the matched partner page — International airfare; Optional tours; Entrance fees for personal extras not listed; Tipping
- **Source match:** `exact` — https://egyptonlinetour.com/tours/8-days-pyramids-the-nile-by-air
- **Pickup / drop-off:** Airport meet-and-greet on arrival; private transfers between airports, hotels, and the cruise
- **Availability:** on request — confirmed in the written quotation
- **Sourced notes:** The Egypt entry visa is listed as included on this particular partner product — your written quotation confirms whether it applies to yours. · The cruise section typically covers Luxor, Edfu, Kom Ombo, and Aswan sightseeing between sailing days.
- **Accommodation level:** sourced — Three nights in a Cairo hotel with daily breakfast, plus four nights full-board on a five-star Superior Nile cruise. (https://egyptonlinetour.com/tours/8-days-pyramids-the-nile-by-air)
- **Cancellation / policy version:** global `2026-08-13`; partner standard schedule on /policies; tour-specific terms in the written quotation

**Destinations and stops as rendered:**

- **Day 1 — Arrival to Egypt Land of Pharaohs + Dinner Cruise**
  - Summary: This part of Private Tour to Cairo, Giza Pyramids & Nile Cruise is planned around arrival to egypt land of pharaohs + dinner cruise. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Dinner Time
  - Overnight
- **Day 2 — Tour to Pyramids & the Egyptian Museum**
  - Summary: This part of Private Tour to Cairo, Giza Pyramids & Nile Cruise is planned around tour to pyramids & the egyptian museum. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Giza Pyramids Complex
  - The Great Pyramid
  - The Sphinx of Chephren
  - The Valley Temple
  - The Grand Egyptian Museum
  - Lunch Time
  - The Egyptian Museum
  - Overnight
- **Day 3 — Fly to Luxor - Visit Luxor East Bank Attractions - Check-in the Cruise**
  - Summary: This part of Private Tour to Cairo, Giza Pyramids & Nile Cruise is planned around fly to luxor - visit luxor east bank attractions - check-in the cruise. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Karnak Temple
  - Luxor Temple by Night  ← _generic copy_
- **Day 4 — Tour to Luxor West Bank Attractions**
  - Summary: This part of Private Tour to Cairo, Giza Pyramids & Nile Cruise is planned around tour to luxor west bank attractions. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - The Fascinating Valley of the Kings
  - Hatshepsut Temple
  - Colossi of Memnon
- **Day 5 — Tour to Edfu & Kom Ombo Temples**
  - Summary: This part of Private Tour to Cairo, Giza Pyramids & Nile Cruise is planned around tour to edfu & kom ombo temples. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Edfu temple
  - Kom Ombo Temple
- **Day 6 — Tour to Aswan Tourist Attractions**
  - Summary: This part of Private Tour to Cairo, Giza Pyramids & Nile Cruise is planned around tour to aswan tourist attractions. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - The High Dam
  - The Unfinished Obelisk
  - Philae Temple
- **Day 7 — Tour to the Great Abu Simbel Temple**
  - Summary: This part of Private Tour to Cairo, Giza Pyramids & Nile Cruise is planned around tour to the great abu simbel temple. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Abu Simbel Temples
  - Lunch Time
  - Overnight
- **Day 8 — End Your Cairo and Nile Cruise Package**
  - Summary: This part of Private Tour to Cairo, Giza Pyramids & Nile Cruise is planned around end your cairo and nile cruise package. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation

_Summary line rendered on cards:_ Explore Cairo, Luxor, Aswan on this 8 days / 7 nights adventure itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services. Planned highlights include Pyramids, Nile Valley temples, Abu Simbel.

#### 9. Cairo, Alexandria, Luxor, and Aswan Private Trip

- **Slug:** `9-days-cairo-alexandria-luxor-aswan-trip`
- **Category / location:** historical · Cairo, Alexandria, Luxor, Aswan
- **Duration:** 9 Days / 8 Nights (9 itinerary days)
- **Starting price:** 1370 — currency unconfirmed, see §A6
- **Cover image:** `/images/tours/9-days-cairo-alexandria-luxor-aswan-trip/gallery-1.jpeg`
- **Gallery:** 8 image(s)
- **Map:** `https://www.google.com/maps/embed?pb=!1m48!1m8!1m3!1d1459090…`
- **Highlights:** _not present in the data model_
- **Inclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Exclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Source match:** unmapped — no reliable source page; fallback wording shown
- **Pickup / drop-off:** ⚠️ **OWNER INPUT REQUIRED** — confirmed in the written quotation
- **Availability:** on request — confirmed in the written quotation
- **Accommodation level:** renders "Accommodation to be confirmed" — tier and properties confirmed in the written quotation
- **Cancellation / policy version:** global `2026-08-13`; partner standard schedule on /policies; tour-specific terms in the written quotation

**Destinations and stops as rendered:**

- **Day 1 — Welcome to the Land of Pharaohs**
  - Summary: This part of Cairo, Alexandria, Luxor, and Aswan Private Trip is planned around welcome to the land of pharaohs. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Dinner Time
  - Overnight
- **Day 2 — Explore Giza Pyramids Complex**
  - Summary: This part of Cairo, Alexandria, Luxor, and Aswan Private Trip is planned around explore giza pyramids complex. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - The Great Pyramid of Khufu
  - The Great Sphinx
  - The Valley Temple
  - The Grand Egyptian Museum
  - Lunch Time
  - Saqqara Step Pyramid
  - Overnight
- **Day 3 — Witness The Wonders of The Nubian City Aswan**
  - Summary: This part of Cairo, Alexandria, Luxor, and Aswan Private Trip is planned around witness the wonders of the nubian city aswan. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - The High Dam
  - The Unfinished Obelisk
  - Lunch Time
  - Philae Temple
  - Overnight
- **Day 4 — Visit Abu Simbel Temples**
  - Summary: This part of Cairo, Alexandria, Luxor, and Aswan Private Trip is planned around visit abu simbel temples. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Abu Simbel Temples
  - Lunch Time
  - Overnight
- **Day 5 — Explore The Largest Open-Air Museum in The World**
  - Summary: This part of Cairo, Alexandria, Luxor, and Aswan Private Trip is planned around explore the largest open-air museum in the world. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Karnak Temple
  - Luxor Temple by Night  ← _generic copy_
- **Day 6 — Complete Your Trip In Luxor**
  - Summary: This part of Cairo, Alexandria, Luxor, and Aswan Private Trip is planned around complete your trip in luxor. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Hatshepsut Temple
  - Valley of the Kings
  - Lunch Time
  - Colossi of Memnon
  - Overnight
- **Day 7 — Fly to Cairo - Visit Cairo Top Attractions**
  - Summary: This part of Cairo, Alexandria, Luxor, and Aswan Private Trip is planned around fly to cairo - visit cairo top attractions. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - The Egyptian Museum
  - Lunch Time
  - The Hanging Church  ← _generic copy_
  - Amr Ibn Al Aas Mosque  ← _generic copy_
  - Ben Ezra Synagogue  ← _generic copy_
  - The National Museum of Egyptian Civilization
  - Al Muizz Street
  - Khan El Khalili Bazaar
  - Overnight
- **Day 8 — Discover The Bride of The Mediterranean Sea Alexandria**
  - Summary: This part of Cairo, Alexandria, Luxor, and Aswan Private Trip is planned around discover the bride of the mediterranean sea alexandria. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Catacombs of Kom El Shoqafa  ← _generic copy_
  - Pompey's Pillar  ← _generic copy_
  - Lunch Time
  - Qaitbay Citadel  ← _generic copy_
  - Alexandria Library  ← _generic copy_
  - Overnight
- **Day 9 — End Your Vacation in Egypt - Fly Back Home**
  - Summary: This part of Cairo, Alexandria, Luxor, and Aswan Private Trip is planned around end your vacation in egypt - fly back home. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation

_Summary line rendered on cards:_ Explore Cairo, Alexandria, Luxor, Aswan on this 9 days / 8 nights historical itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services.

#### 10. Cairo, Nile Cruise, and Hurghada Vacation

- **Slug:** `12-days-family-egypt-red-sea-holiday`
- **Category / location:** adventure · Cairo, Luxor, Aswan, Hurghada
- **Duration:** 12 Days / 11 Nights (12 itinerary days)
- **Starting price:** 1740 — currency unconfirmed, see §A6
- **Cover image:** `/images/tours/12-days-family-egypt-red-sea-holiday/gallery-1.jpeg`
- **Gallery:** 8 image(s)
- **Map:** `https://www.google.com/maps/embed?pb=!1m52!1m12!1m3!1d366649…`
- **Highlights:** Pyramids; temples; Red Sea snorkeling; beach resort; water sports; family entertainment.
- **Inclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Exclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Source match:** `partial` — https://egyptonlinetour.com/tours/12-days-luxury-cairo-the-nile-red-sea
- **Pickup / drop-off:** ⚠️ **OWNER INPUT REQUIRED** — confirmed in the written quotation
- **Availability:** on request — confirmed in the written quotation
- **Sourced notes:** The comparable partner package combines Cairo hotel nights, a full-board five-star Nile cruise, and Hurghada resort nights with domestic flights. · Its Hurghada segment includes guided diving/snorkelling days with equipment, lunch, and soft drinks; your package’s Red Sea arrangements are confirmed in the written quotation.
- **Accommodation level:** renders "Accommodation to be confirmed" — tier and properties confirmed in the written quotation
- **Cancellation / policy version:** global `2026-08-13`; partner standard schedule on /policies; tour-specific terms in the written quotation

**Destinations and stops as rendered:**

- **Day 1 — Arrival to Egypt + Dinner Cruise**
  - Summary: This part of Cairo, Nile Cruise, and Hurghada Vacation is planned around arrival to egypt + dinner cruise. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Dinner Time
  - Overnight
- **Day 2 — Tour to The Pyramids, Saqqara, and Gem**
  - Summary: This part of Cairo, Nile Cruise, and Hurghada Vacation is planned around tour to the pyramids, saqqara, and gem. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Giza Pyramids Complex
  - The Great Pyramid
  - The Great Sphinx
  - The Valley Temple
  - The Grand Egyptian Museum
  - Lunch Time
  - Saqqara Step Pyramid
  - Overnight
- **Day 3 — Fly to Aswan - Visit Aswan Attractions**
  - Summary: This part of Cairo, Nile Cruise, and Hurghada Vacation is planned around fly to aswan - visit aswan attractions. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - The High Dam
  - The Unfinished Obelisk
  - Philae Temple
- **Day 4 — Abu Simbel Day Tour**
  - Summary: This part of Cairo, Nile Cruise, and Hurghada Vacation is planned around abu simbel day tour. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Abu Simbel Temples
- **Day 5 — Discover Edfu & Kom Ombo Temples**
  - Summary: This part of Cairo, Nile Cruise, and Hurghada Vacation is planned around discover edfu & kom ombo temples. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Kom Ombo Temple
  - Edfu temple
- **Day 6 — Explore Luxor East Bank Attractions / Head to Hurghada**
  - Summary: This part of Cairo, Nile Cruise, and Hurghada Vacation is planned around explore luxor east bank attractions / head to hurghada. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Karnak Temple
  - Valley of the Kings
  - Hatshepsut Temple
  - Colossi of Memnon
- **Day 7 — Hurghada Snorkeling Excursion**
  - Summary: This part of Cairo, Nile Cruise, and Hurghada Vacation is planned around hurghada snorkeling excursion. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
- **Day 8 — Safari Trip in Hurghada**
  - Summary: This part of Cairo, Nile Cruise, and Hurghada Vacation is planned around safari trip in hurghada. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
- **Day 9 — Free Day in Hurghada**
  - Summary: This part of Cairo, Nile Cruise, and Hurghada Vacation is planned around free day in hurghada. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
- **Day 10 — Free Day in Hurghada**
  - Summary: This part of Cairo, Nile Cruise, and Hurghada Vacation is planned around free day in hurghada. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
- **Day 11 — Fly to Cairo Sightseeing Tour**
  - Summary: This part of Cairo, Nile Cruise, and Hurghada Vacation is planned around fly to cairo sightseeing tour. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - The Egyptian Museum
  - Lunch Time
  - Salah El Din Citadel
  - Mohamed Ali Mosque
  - The National Museum of Egyptian Civilization
  - Al Muizz Street
  - Khan El Khalili Bazaar
  - Overnight
- **Day 12 — End of Your 12 Days Egypt Tours**
  - Summary: This part of Cairo, Nile Cruise, and Hurghada Vacation is planned around end of your 12 days egypt tours. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation

_Summary line rendered on cards:_ Explore Cairo, Luxor, Aswan, Hurghada on this 12 days / 11 nights adventure itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services. Planned highlights include Pyramids, temples, Red Sea snorkeling.

#### 11. Marvelous of Egypt Pyramids Tour

- **Slug:** `14-days-trip-to-the-best-of-egypt`
- **Category / location:** cultural · Cairo, Nile River
- **Duration:** 14 Days / 13 Nights (14 itinerary days)
- **Starting price:** 1920 — currency unconfirmed, see §A6
- **Cover image:** `/images/tours/14-days-trip-to-the-best-of-egypt/gallery-1.jpeg`
- **Gallery:** 10 image(s)
- **Map:** `https://www.google.com/maps/embed?pb=!1m64!1m12!1m3!1d729936…`
- **Highlights:** _not present in the data model_
- **Inclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Exclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Source match:** unmapped — no reliable source page; fallback wording shown
- **Pickup / drop-off:** ⚠️ **OWNER INPUT REQUIRED** — confirmed in the written quotation
- **Availability:** on request — confirmed in the written quotation
- **Accommodation level:** renders "Accommodation to be confirmed" — tier and properties confirmed in the written quotation
- **Cancellation / policy version:** global `2026-08-13`; partner standard schedule on /policies; tour-specific terms in the written quotation

**Destinations and stops as rendered:**

- **Day 1 — Welcome to our Amazing Country**
  - Summary: This part of Marvelous of Egypt Pyramids Tour is planned around welcome to our amazing country. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Dinner Time
  - Overnight
- **Day 2 — Trip to Egyptian Pyramids & Fly to Hurghada**
  - Summary: This part of Marvelous of Egypt Pyramids Tour is planned around trip to egyptian pyramids & fly to hurghada. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Giza Pyramids Complex
  - The Great Pyramid
  - The Great Sphinx
  - The Valley Temple
  - The Grand Egyptian Museum
  - Lunch Time
  - Saqqara Step Pyramid
  - Overnight
- **Day 3 — Free Day in Hurghada**
  - Summary: This part of Marvelous of Egypt Pyramids Tour is planned around free day in hurghada. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
- **Day 4 — Scuba Diving in Hurghada**
  - Summary: This part of Marvelous of Egypt Pyramids Tour is planned around scuba diving in hurghada. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
- **Day 5 — Safari Tour in Hurghada**
  - Summary: This part of Marvelous of Egypt Pyramids Tour is planned around safari tour in hurghada. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
- **Day 6 — A Tour to Luxor East Bank Attractions**
  - Summary: This part of Marvelous of Egypt Pyramids Tour is planned around a tour to luxor east bank attractions. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Karnak Temple
  - Luxor Temple By Night  ← _generic copy_
- **Day 7 — A Trip to Luxor West Bank Landmarks**
  - Summary: This part of Marvelous of Egypt Pyramids Tour is planned around a trip to luxor west bank landmarks. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Hatshepsut Temple
  - Valley of the Kings
  - Colossi of Memnon
- **Day 8 — Head to Edfu & Kom Ombo**
  - Summary: This part of Marvelous of Egypt Pyramids Tour is planned around head to edfu & kom ombo. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Edfu temple
  - Kom Ombo Temple
- **Day 9 — Explore Aswan City Landmarks**
  - Summary: This part of Marvelous of Egypt Pyramids Tour is planned around explore aswan city landmarks. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - The High Dam
  - The Unfinished Obelisk
  - Philae Temple
- **Day 10 — Tour to Abu Simbel Temples by Car & Fly to Cairo**
  - Summary: This part of Marvelous of Egypt Pyramids Tour is planned around tour to abu simbel temples by car & fly to cairo. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Abu Simbel Temples
  - Lunch Time
  - Overnight
- **Day 11 — Witness Old Cairo Highlights**
  - Summary: This part of Marvelous of Egypt Pyramids Tour is planned around witness old cairo highlights. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - The Egyptian Museum
  - Lunch Time
  - Amr Ibn Al Aas Mosque  ← _generic copy_
  - The Hanging Church  ← _generic copy_
  - Ben Ezra Synagogue  ← _generic copy_
  - The National Museum of Egyptian Civilization
  - Al Muizz Street
  - Khan El Khalili Bazaar
  - Overnight
- **Day 12 — Discover Islamic Cairo Attractions**
  - Summary: This part of Marvelous of Egypt Pyramids Tour is planned around discover islamic cairo attractions. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Salah El Din Citadel
  - Mohamed Ali Mosque
  - Lunch Time
  - Sultan Hassan Mosque  ← _generic copy_
  - Al Rifai Mosque  ← _generic copy_
  - Overnight
- **Day 13 — Day Tour to Alexandria Attractions**
  - Summary: This part of Marvelous of Egypt Pyramids Tour is planned around day tour to alexandria attractions. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Catacombs of Kom El Shoqafa  ← _generic copy_
  - Pompey's Pillar  ← _generic copy_
  - Qaitbay Citadel  ← _generic copy_
  - Lunch Time
  - Alexandria Library  ← _generic copy_
  - Overnight
- **Day 14 — End Your 14 Days to the Best of Egypt**
  - Summary: This part of Marvelous of Egypt Pyramids Tour is planned around end your 14 days to the best of egypt. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation

_Summary line rendered on cards:_ Explore Cairo, Nile River on this 14 days / 13 nights cultural itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services.

#### 12. Best of Egypt Private Tour

- **Slug:** `15-days-marvelous-egypt-tour-package`
- **Category / location:** cultural · Cairo, Giza, Luxor, Western Desert
- **Duration:** 15 Days / 14 Nights (15 itinerary days)
- **Starting price:** 1930 — currency unconfirmed, see §A6
- **Cover image:** `/images/tours/15-days-marvelous-egypt-tour-package/gallery-1.jpeg`
- **Gallery:** 10 image(s)
- **Map:** `https://www.google.com/maps/embed?pb=!1m52!1m12!1m3!1d362064…`
- **Highlights:** _not present in the data model_
- **Inclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Exclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Source match:** `partial` — https://egyptonlinetour.com/tours/15-days-marvelous-tour-package-in-egypt
- **Pickup / drop-off:** ⚠️ **OWNER INPUT REQUIRED** — confirmed in the written quotation
- **Availability:** on request — confirmed in the written quotation
- **Sourced notes:** The partner sells packages in four accommodation tiers — Standard, Premium, Luxury, and High End — with the same experiences at different hotel levels. Your quotation states the tier and properties. · The partner version of this itinerary is a group trip using a Dahabiya cruise and a Fayoum desert day; Travision’s version is private and includes Hurghada — the two are not interchangeable.
- **Accommodation level:** renders "Accommodation to be confirmed" — tier and properties confirmed in the written quotation
- **Cancellation / policy version:** global `2026-08-13`; partner standard schedule on /policies; tour-specific terms in the written quotation

**Destinations and stops as rendered:**

- **Day 1 — Arrival to The Land of Pharaohs**
  - Summary: This part of Best of Egypt Private Tour is planned around arrival to the land of pharaohs. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Dinner Time
  - Overnight
- **Day 2 — Tour to the Pyramids**
  - Summary: This part of Best of Egypt Private Tour is planned around tour to the pyramids. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Giza Pyramids Complex
  - The Great Pyramid
  - The Great Sphinx
  - The Valley Temple
  - The Grand Egyptian Museum
  - Lunch Time
  - Saqqara Step Pyramid
  - Overnight
- **Day 3 — Tour to Alexandria Landmarks**
  - Summary: This part of Best of Egypt Private Tour is planned around tour to alexandria landmarks. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - The Catacombs  ← _generic copy_
  - Pompey's Pillar  ← _generic copy_
  - Qaitbay Citadel  ← _generic copy_
  - Lunch Time
  - Alexandria Library  ← _generic copy_
  - Overnight
- **Day 4 — Fly to Aswan - Visit Aswan Attractions**
  - Summary: This part of Best of Egypt Private Tour is planned around fly to aswan - visit aswan attractions. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - The High Dam
  - The Unfinished Obelisk
  - Philae Temple
- **Day 5 — Tour To Abu Simbel Temple**
  - Summary: This part of Best of Egypt Private Tour is planned around tour to abu simbel temple. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Abu Simbel Temples
- **Day 6 — Explore Edfu & Kom Ombo Temples**
  - Summary: This part of Best of Egypt Private Tour is planned around explore edfu & kom ombo temples. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Kom Ombo Temple
  - Edfu temple
- **Day 7 — Tour to Luxor East Bank Attractions**
  - Summary: This part of Best of Egypt Private Tour is planned around tour to luxor east bank attractions. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Karnak Temple
  - Lunch Time
  - Luxor Temple
  - Overnight
- **Day 8 — Tour to Luxor West Bank**
  - Summary: This part of Best of Egypt Private Tour is planned around tour to luxor west bank. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - Valley of the Kings
  - Hatshepsut Temple
  - Colossi of Memnon
  - Lunch Time
  - Overnight
- **Day 9 — Transfer to Hurghada**
  - Summary: This part of Best of Egypt Private Tour is planned around transfer to hurghada. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
- **Day 10 — Enjoy Snorkeling in Hurghada**
  - Summary: This part of Best of Egypt Private Tour is planned around enjoy snorkeling in hurghada. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
- **Day 11 — Free Day in Hurghada**
  - Summary: This part of Best of Egypt Private Tour is planned around free day in hurghada. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
- **Day 12 — Safari Tour in Hurghada**
  - Summary: This part of Best of Egypt Private Tour is planned around safari tour in hurghada. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
- **Day 13 — Fly from Hurghada to Cairo**
  - Summary: This part of Best of Egypt Private Tour is planned around fly from hurghada to cairo. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
  - The Egyptian Museum
  - Lunch Time
  - Salah El Din Citadel
  - Mohamed Ali Mosque
  - The National Museum of Egyptian Civilization
  - Al Muizz Street
  - Khan El Khalili Bazaar
  - Overnight
- **Day 14 — Free Day in Cairo**
  - Summary: This part of Best of Egypt Private Tour is planned around free day in cairo. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Accommodation to be confirmed
- **Day 15 — End Your 15 Days Egypt Tour**
  - Summary: This part of Best of Egypt Private Tour is planned around end your 15 days egypt tour. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation

_Summary line rendered on cards:_ Explore Cairo, Giza, Luxor, Western Desert on this 15 days / 14 nights cultural itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services.

#### 13. Cairo Day Tour

- **Slug:** `cairo-day-tour`
- **Category / location:** cultural · Cairo
- **Duration:** 1 Day (1 itinerary day)
- **Starting price:** 85 — currency unconfirmed, see §A6
- **Cover image:** `/images/day-tours/cairo-day-tour.jpeg`
- **Gallery:** 0 image(s) — _not present in the data model_
- **Map:** _not present in the data model_
- **Highlights:** Giza Pyramids; Great Sphinx; Egyptian Museum
- **Inclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Exclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Source match:** `category` — https://egyptonlinetour.com/tours/exciting-private-day-trip-of-giza
- **Pickup / drop-off:** Hotel pickup and drop-off in Cairo or Giza
- **Availability:** Daily
- **Accommodation level:** renders "Return arrangements to be confirmed" — tier and properties confirmed in the written quotation
- **Cancellation / policy version:** global `2026-08-13`; partner standard schedule on /policies; tour-specific terms in the written quotation

**Destinations and stops as rendered:**

- **Day 1 — Full Day Experience: Cairo Day Tour**
  - Summary: This part of Cairo Day Tour is planned around full day experience: cairo day tour. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Return arrangements to be confirmed
  - Giza Pyramids
  - Great Sphinx
  - Egyptian Museum

_Summary line rendered on cards:_ Explore Cairo on this 1 day cultural itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services. Planned highlights include Giza Pyramids, Great Sphinx, Egyptian Museum.

#### 14. Giza Pyramids Day Tour

- **Slug:** `giza-pyramids-day-tour`
- **Category / location:** historical · Cairo, Giza
- **Duration:** 1 Day (1 itinerary day)
- **Starting price:** 75 — currency unconfirmed, see §A6
- **Cover image:** `/images/day-tours/giza-pyramids-day-tour.jpeg`
- **Gallery:** 0 image(s) — _not present in the data model_
- **Map:** _not present in the data model_
- **Highlights:** Great Pyramid of Khufu; Sphinx; Valley Temple; Optional camel ride
- **Inclusions:** sourced from the matched partner page — Hotel pickup and drop-off; Private air-conditioned vehicle; Professional English-speaking Egyptologist guide; Entrance fees to the mentioned sites; Bottled water during the tour
- **Exclusions:** sourced from the matched partner page — Personal expenses; Tipping (optional); Entry inside the pyramids — an optional extra ticket; Travel insurance
- **Source match:** `exact` — https://egyptonlinetour.com/tours/exciting-private-day-trip-of-giza
- **Pickup / drop-off:** Pickup and drop-off at your hotel in Cairo or Giza
- **Availability:** Daily
- **Sourced notes:** Entry inside the Great Pyramid uses a separate ticket when available; passages are narrow, steep, warm, and enclosed — mention mobility, breathing, or claustrophobia concerns before requesting it. · Guides do not accompany visitors inside the pyramids. · A camel ride across the Giza Plateau can be arranged as an optional extra.
- **Accommodation level:** renders "Return arrangements to be confirmed" — tier and properties confirmed in the written quotation
- **Cancellation / policy version:** global `2026-08-13`; partner standard schedule on /policies; tour-specific terms in the written quotation

**Destinations and stops as rendered:**

- **Day 1 — Full Day Experience: Giza Pyramids Day Tour**
  - Summary: This part of Giza Pyramids Day Tour is planned around full day experience: giza pyramids day tour. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Return arrangements to be confirmed
  - Great Pyramid of Khufu
  - Sphinx
  - Valley Temple
  - Optional camel ride  ← _generic copy_

_Summary line rendered on cards:_ Explore Cairo, Giza on this 1 day historical itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services. Planned highlights include Great Pyramid of Khufu, Sphinx, Valley Temple.

#### 15. Luxor Day Tour

- **Slug:** `luxor-day-tour`
- **Category / location:** historical · Luxor
- **Duration:** 1 Day (1 itinerary day)
- **Starting price:** 110 — currency unconfirmed, see §A6
- **Cover image:** `/images/day-tours/luxor-day-tour.jpeg`
- **Gallery:** 0 image(s) — _not present in the data model_
- **Map:** _not present in the data model_
- **Highlights:** Valley of the Kings; Hatshepsut Temple; Karnak Temple
- **Inclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Exclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Source match:** `category` — https://egyptonlinetour.com/tours/luxor-west-bank-tour-private-day-trip
- **Pickup / drop-off:** Pickup and drop-off at your Luxor hotel or Nile cruise
- **Availability:** Daily
- **Sourced notes:** West Bank sightseeing typically starts early — around 5:00 AM in the source itinerary — to beat the heat.
- **Accommodation level:** renders "Return arrangements to be confirmed" — tier and properties confirmed in the written quotation
- **Cancellation / policy version:** global `2026-08-13`; partner standard schedule on /policies; tour-specific terms in the written quotation

**Destinations and stops as rendered:**

- **Day 1 — Full Day Experience: Luxor Day Tour**
  - Summary: This part of Luxor Day Tour is planned around full day experience: luxor day tour. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Return arrangements to be confirmed
  - Valley of the Kings
  - Hatshepsut Temple
  - Karnak Temple

_Summary line rendered on cards:_ Explore Luxor on this 1 day historical itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services. Planned highlights include Valley of the Kings, Hatshepsut Temple, Karnak Temple.

#### 16. Aswan Day Tour

- **Slug:** `aswan-day-tour`
- **Category / location:** historical · Aswan
- **Duration:** 1 Day (1 itinerary day)
- **Starting price:** 95 — currency unconfirmed, see §A6
- **Cover image:** `/images/day-tours/aswan-day-tour.jpeg`
- **Gallery:** 0 image(s) — _not present in the data model_
- **Map:** _not present in the data model_
- **Highlights:** High Dam; Unfinished Obelisk; Philae Temple
- **Inclusions:** sourced from the matched partner page — Hotel pickup and drop-off in Aswan; Private air-conditioned transport; Private guided visit; Entry fees for the listed sites; Applicable taxes and service charges
- **Exclusions:** sourced from the matched partner page — Tips and personal expenses; Lunch — available as an optional addition
- **Source match:** `exact` — https://egyptonlinetour.com/tours/philae-temple-high-dam-and-obelisk-private-tour
- **Pickup / drop-off:** Pickup and drop-off at your Aswan hotel
- **Availability:** Daily
- **Accommodation level:** renders "Return arrangements to be confirmed" — tier and properties confirmed in the written quotation
- **Cancellation / policy version:** global `2026-08-13`; partner standard schedule on /policies; tour-specific terms in the written quotation

**Destinations and stops as rendered:**

- **Day 1 — Full Day Experience: Aswan Day Tour**
  - Summary: This part of Aswan Day Tour is planned around full day experience: aswan day tour. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Return arrangements to be confirmed
  - High Dam
  - Unfinished Obelisk
  - Philae Temple

_Summary line rendered on cards:_ Explore Aswan on this 1 day historical itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services. Planned highlights include High Dam, Unfinished Obelisk, Philae Temple.

#### 17. Abu Simbel Day Tour

- **Slug:** `abu-simbel-day-tour`
- **Category / location:** historical · Aswan, Abu Simbel
- **Duration:** 1 Day (1 itinerary day)
- **Starting price:** 165 — currency unconfirmed, see §A6
- **Cover image:** `/images/day-tours/abu-simbel-day-tour.jpeg`
- **Gallery:** 0 image(s) — _not present in the data model_
- **Map:** _not present in the data model_
- **Highlights:** Great Temple of Ramses II; Temple of Nefertari; UNESCO rescue site
- **Inclusions:** sourced from the matched partner page — Hotel pickup and drop-off in Aswan; Private air-conditioned transport; Private guide; Entry tickets; Applicable taxes and service fees
- **Exclusions:** sourced from the matched partner page — Personal expenses; Additional services not listed as included
- **Source match:** `exact` — https://egyptonlinetour.com/tours/private-tour-to-abu-simbel-from-aswan-by-car
- **Pickup / drop-off:** Pickup from your Aswan hotel; drop-off at your hotel or Nile cruise
- **Availability:** Daily
- **Accommodation level:** renders "Return arrangements to be confirmed" — tier and properties confirmed in the written quotation
- **Cancellation / policy version:** global `2026-08-13`; partner standard schedule on /policies; tour-specific terms in the written quotation

**Destinations and stops as rendered:**

- **Day 1 — Full Day Experience: Abu Simbel Day Tour**
  - Summary: This part of Abu Simbel Day Tour is planned around full day experience: abu simbel day tour. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Return arrangements to be confirmed
  - Great Temple of Ramses II  ← _generic copy_
  - Temple of Nefertari  ← _generic copy_
  - UNESCO rescue site  ← _generic copy_

_Summary line rendered on cards:_ Explore Aswan, Abu Simbel on this 1 day historical itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services. Planned highlights include Great Temple of Ramses II, Temple of Nefertari, UNESCO rescue site.

#### 18. Alexandria Day Tour

- **Slug:** `alexandria-day-tour`
- **Category / location:** historical · Alexandria
- **Duration:** 1 Day (1 itinerary day)
- **Starting price:** 120 — currency unconfirmed, see §A6
- **Cover image:** `/images/day-tours/alexandria-day-tour.jpeg`
- **Gallery:** 0 image(s) — _not present in the data model_
- **Map:** _not present in the data model_
- **Highlights:** Bibliotheca Alexandrina; Qaitbay Citadel; Catacombs of Kom El Shoqafa
- **Inclusions:** sourced from the matched partner page — Hotel pickup and drop-off; Private air-conditioned transport; Expert guide
- **Exclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Source match:** `exact` — https://egyptonlinetour.com/tours/alexandria-archeological-day-tour-top-sites
- **Pickup / drop-off:** Hotel pickup and drop-off
- **Availability:** Daily
- **Sourced notes:** The partner itinerary covers the Catacombs, Roman Amphitheatre, Pompey’s Pillar, Bibliotheca Alexandrina, Qaitbay Citadel, Montazah Gardens, and Stanley Bridge.
- **Accommodation level:** renders "Return arrangements to be confirmed" — tier and properties confirmed in the written quotation
- **Cancellation / policy version:** global `2026-08-13`; partner standard schedule on /policies; tour-specific terms in the written quotation

**Destinations and stops as rendered:**

- **Day 1 — Full Day Experience: Alexandria Day Tour**
  - Summary: This part of Alexandria Day Tour is planned around full day experience: alexandria day tour. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Return arrangements to be confirmed
  - Bibliotheca Alexandrina  ← _generic copy_
  - Qaitbay Citadel  ← _generic copy_
  - Catacombs of Kom El Shoqafa  ← _generic copy_

_Summary line rendered on cards:_ Explore Alexandria on this 1 day historical itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services. Planned highlights include Bibliotheca Alexandrina, Qaitbay Citadel, Catacombs of Kom El Shoqafa.

#### 19. Old Cairo Day Tour

- **Slug:** `old-cairo-day-tour`
- **Category / location:** cultural · Cairo
- **Duration:** 1 Day (1 itinerary day)
- **Starting price:** 70 — currency unconfirmed, see §A6
- **Cover image:** `/images/day-tours/old-cairo-day-tour.jpeg`
- **Gallery:** 0 image(s) — _not present in the data model_
- **Map:** _not present in the data model_
- **Highlights:** Hanging Church; Coptic Museum; Ben Ezra Synagogue; Khan El Khalili
- **Inclusions:** sourced from the matched partner page — Hotel pickup and drop-off; Modern air-conditioned vehicle for the entire trip; Expert English-speaking tour guide; Entrance fees to the listed attractions; Mineral water during the excursion; All applicable taxes and service charges
- **Exclusions:** sourced from the matched partner page — Personal expenses such as souvenirs; Optional gratuities for guide and driver; Travel insurance; Any extras not specified in the itinerary
- **Source match:** `exact` — https://egyptonlinetour.com/tours/old-cairo-tour
- **Pickup / drop-off:** Pickup and drop-off at your Cairo hotel
- **Availability:** Daily
- **Accommodation level:** renders "Return arrangements to be confirmed" — tier and properties confirmed in the written quotation
- **Cancellation / policy version:** global `2026-08-13`; partner standard schedule on /policies; tour-specific terms in the written quotation

**Destinations and stops as rendered:**

- **Day 1 — Full Day Experience: Old Cairo Day Tour**
  - Summary: This part of Old Cairo Day Tour is planned around full day experience: old cairo day tour. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Return arrangements to be confirmed
  - Hanging Church  ← _generic copy_
  - Coptic Museum  ← _generic copy_
  - Ben Ezra Synagogue  ← _generic copy_
  - Khan El Khalili

_Summary line rendered on cards:_ Explore Cairo on this 1 day cultural itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services. Planned highlights include Hanging Church, Coptic Museum, Ben Ezra Synagogue.

#### 20. Hurghada Day Tour

- **Slug:** `hurghada-day-tour`
- **Category / location:** adventure · Hurghada
- **Duration:** 1 Day (1 itinerary day)
- **Starting price:** 90 — currency unconfirmed, see §A6
- **Cover image:** `/images/day-tours/hurghada-day-tour.jpeg`
- **Gallery:** 0 image(s) — _not present in the data model_
- **Map:** _not present in the data model_
- **Highlights:** Giftun Island snorkeling; Red Sea coral reefs
- **Inclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Exclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Source match:** unmapped — no reliable source page; fallback wording shown
- **Pickup / drop-off:** ⚠️ **OWNER INPUT REQUIRED** — confirmed in the written quotation
- **Availability:** on request — confirmed in the written quotation
- **Accommodation level:** renders "Return arrangements to be confirmed" — tier and properties confirmed in the written quotation
- **Cancellation / policy version:** global `2026-08-13`; partner standard schedule on /policies; tour-specific terms in the written quotation

**Destinations and stops as rendered:**

- **Day 1 — Full Day Experience: Hurghada Day Tour**
  - Summary: This part of Hurghada Day Tour is planned around full day experience: hurghada day tour. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Return arrangements to be confirmed
  - Giftun Island snorkeling  ← _generic copy_
  - Red Sea coral reefs  ← _generic copy_

_Summary line rendered on cards:_ Explore Hurghada on this 1 day adventure itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services. Planned highlights include Giftun Island snorkeling, Red Sea coral reefs.

#### 21. Sharm El Sheikh Day Tour

- **Slug:** `sharm-el-sheikh-day-tour`
- **Category / location:** adventure · Sharm El Sheikh
- **Duration:** 1 Day (1 itinerary day)
- **Starting price:** 95 — currency unconfirmed, see §A6
- **Cover image:** `/images/day-tours/sharm-el-sheikh-day-tour.jpeg`
- **Gallery:** 0 image(s) — _not present in the data model_
- **Map:** _not present in the data model_
- **Highlights:** Ras Mohammed National Park; Desert safari; Red Sea beaches
- **Inclusions:** sourced from the matched partner page — Hotel pickup and drop-off in Sharm El Sheikh; Air-conditioned transfers to and from the marina; Professional English-speaking tour guide; Ras Mohamed National Park entrance tickets; Snorkelling essentials — mask, fins, and life jacket; Lunch served on board; Water and soft drinks during the trip; All taxes and service charges
- **Exclusions:** sourced from the matched partner page — Optional activities or services not mentioned in the program; Personal expenses and tipping; Visa fees; International or domestic flight tickets
- **Source match:** `partial` — https://egyptonlinetour.com/tours/ras-mohamed-boat-trip-white-island
- **Pickup / drop-off:** Pickup and drop-off at your Sharm El Sheikh hotel
- **Availability:** Daily
- **Sourced notes:** These logistics describe the partner’s Ras Mohamed boat trip; a desert-safari component is not covered by that source.
- **Accommodation level:** renders "Return arrangements to be confirmed" — tier and properties confirmed in the written quotation
- **Cancellation / policy version:** global `2026-08-13`; partner standard schedule on /policies; tour-specific terms in the written quotation

**Destinations and stops as rendered:**

- **Day 1 — Full Day Experience: Sharm El Sheikh Day Tour**
  - Summary: This part of Sharm El Sheikh Day Tour is planned around full day experience: sharm el sheikh day tour. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Return arrangements to be confirmed
  - Ras Mohammed National Park  ← _generic copy_
  - Desert safari  ← _generic copy_
  - Red Sea beaches  ← _generic copy_

_Summary line rendered on cards:_ Explore Sharm El Sheikh on this 1 day adventure itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services. Planned highlights include Ras Mohammed National Park, Desert safari, Red Sea beaches.

#### 22. Marsa Alam Day Tour

- **Slug:** `marsa-alam-day-tour`
- **Category / location:** adventure · Marsa Alam
- **Duration:** 1 Day (1 itinerary day)
- **Starting price:** 100 — currency unconfirmed, see §A6
- **Cover image:** `/images/day-tours/marsa-alam-day-tour.jpeg`
- **Gallery:** 0 image(s) — _not present in the data model_
- **Map:** _not present in the data model_
- **Highlights:** Sataya Dolphin Reef; Samadai coral walls
- **Inclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Exclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Source match:** unmapped — no reliable source page; fallback wording shown
- **Pickup / drop-off:** ⚠️ **OWNER INPUT REQUIRED** — confirmed in the written quotation
- **Availability:** on request — confirmed in the written quotation
- **Accommodation level:** renders "Return arrangements to be confirmed" — tier and properties confirmed in the written quotation
- **Cancellation / policy version:** global `2026-08-13`; partner standard schedule on /policies; tour-specific terms in the written quotation

**Destinations and stops as rendered:**

- **Day 1 — Full Day Experience: Marsa Alam Day Tour**
  - Summary: This part of Marsa Alam Day Tour is planned around full day experience: marsa alam day tour. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Return arrangements to be confirmed
  - Sataya Dolphin Reef  ← _generic copy_
  - Samadai coral walls  ← _generic copy_

_Summary line rendered on cards:_ Explore Marsa Alam on this 1 day adventure itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services. Planned highlights include Sataya Dolphin Reef, Samadai coral walls.

#### 23. El Gouna Day Tour

- **Slug:** `el-gouna-day-tour`
- **Category / location:** adventure · El Gouna
- **Duration:** 1 Day (1 itinerary day)
- **Starting price:** 85 — currency unconfirmed, see §A6
- **Cover image:** `/images/day-tours/el-gouna-day-tour.jpeg`
- **Gallery:** 0 image(s) — _not present in the data model_
- **Map:** _not present in the data model_
- **Highlights:** Lagoon boat trip; Island snorkeling
- **Inclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Exclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Source match:** unmapped — no reliable source page; fallback wording shown
- **Pickup / drop-off:** ⚠️ **OWNER INPUT REQUIRED** — confirmed in the written quotation
- **Availability:** on request — confirmed in the written quotation
- **Accommodation level:** renders "Return arrangements to be confirmed" — tier and properties confirmed in the written quotation
- **Cancellation / policy version:** global `2026-08-13`; partner standard schedule on /policies; tour-specific terms in the written quotation

**Destinations and stops as rendered:**

- **Day 1 — Full Day Experience: El Gouna Day Tour**
  - Summary: This part of El Gouna Day Tour is planned around full day experience: el gouna day tour. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Return arrangements to be confirmed
  - Lagoon boat trip  ← _generic copy_
  - Island snorkeling  ← _generic copy_

_Summary line rendered on cards:_ Explore El Gouna on this 1 day adventure itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services. Planned highlights include Lagoon boat trip, Island snorkeling.

#### 24. Makadi Bay Day Tour

- **Slug:** `makadi-bay-day-tour`
- **Category / location:** adventure · Makadi Bay
- **Duration:** 1 Day (1 itinerary day)
- **Starting price:** 80 — currency unconfirmed, see §A6
- **Cover image:** `/images/day-tours/makadi-bay-day-tour.jpeg`
- **Gallery:** 0 image(s) — _not present in the data model_
- **Map:** _not present in the data model_
- **Highlights:** House-reef snorkeling; Semi-submarine coral tour
- **Inclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Exclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Source match:** unmapped — no reliable source page; fallback wording shown
- **Pickup / drop-off:** ⚠️ **OWNER INPUT REQUIRED** — confirmed in the written quotation
- **Availability:** on request — confirmed in the written quotation
- **Accommodation level:** renders "Return arrangements to be confirmed" — tier and properties confirmed in the written quotation
- **Cancellation / policy version:** global `2026-08-13`; partner standard schedule on /policies; tour-specific terms in the written quotation

**Destinations and stops as rendered:**

- **Day 1 — Full Day Experience: Makadi Bay Day Tour**
  - Summary: This part of Makadi Bay Day Tour is planned around full day experience: makadi bay day tour. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Return arrangements to be confirmed
  - House-reef snorkeling  ← _generic copy_
  - Semi-submarine coral tour  ← _generic copy_

_Summary line rendered on cards:_ Explore Makadi Bay on this 1 day adventure itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services. Planned highlights include House-reef snorkeling, Semi-submarine coral tour.

#### 25. Soma Bay Day Tour

- **Slug:** `soma-bay-day-tour`
- **Category / location:** adventure · Soma Bay
- **Duration:** 1 Day (1 itinerary day)
- **Starting price:** 90 — currency unconfirmed, see §A6
- **Cover image:** `/images/day-tours/soma-bay-day-tour.jpeg`
- **Gallery:** 0 image(s) — _not present in the data model_
- **Map:** _not present in the data model_
- **Highlights:** Tobia Islands snorkeling; Kitesurfing
- **Inclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Exclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Source match:** unmapped — no reliable source page; fallback wording shown
- **Pickup / drop-off:** ⚠️ **OWNER INPUT REQUIRED** — confirmed in the written quotation
- **Availability:** on request — confirmed in the written quotation
- **Accommodation level:** renders "Return arrangements to be confirmed" — tier and properties confirmed in the written quotation
- **Cancellation / policy version:** global `2026-08-13`; partner standard schedule on /policies; tour-specific terms in the written quotation

**Destinations and stops as rendered:**

- **Day 1 — Full Day Experience: Soma Bay Day Tour**
  - Summary: This part of Soma Bay Day Tour is planned around full day experience: soma bay day tour. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Return arrangements to be confirmed
  - Tobia Islands snorkeling  ← _generic copy_
  - Kitesurfing  ← _generic copy_

_Summary line rendered on cards:_ Explore Soma Bay on this 1 day adventure itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services. Planned highlights include Tobia Islands snorkeling, Kitesurfing.

#### 26. Port Ghalib Day Tour

- **Slug:** `port-ghalib-day-tour`
- **Category / location:** adventure · Port Ghalib
- **Duration:** 1 Day (1 itinerary day)
- **Starting price:** 95 — currency unconfirmed, see §A6
- **Cover image:** `/images/day-tours/port-ghalib-day-tour.jpeg`
- **Gallery:** 0 image(s) — _not present in the data model_
- **Map:** _not present in the data model_
- **Highlights:** Marina coral safari; Snorkeling lagoons
- **Inclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Exclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Source match:** unmapped — no reliable source page; fallback wording shown
- **Pickup / drop-off:** ⚠️ **OWNER INPUT REQUIRED** — confirmed in the written quotation
- **Availability:** on request — confirmed in the written quotation
- **Accommodation level:** renders "Return arrangements to be confirmed" — tier and properties confirmed in the written quotation
- **Cancellation / policy version:** global `2026-08-13`; partner standard schedule on /policies; tour-specific terms in the written quotation

**Destinations and stops as rendered:**

- **Day 1 — Full Day Experience: Port Ghalib Day Tour**
  - Summary: This part of Port Ghalib Day Tour is planned around full day experience: port ghalib day tour. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Return arrangements to be confirmed
  - Marina coral safari  ← _generic copy_
  - Snorkeling lagoons  ← _generic copy_

_Summary line rendered on cards:_ Explore Port Ghalib on this 1 day adventure itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services. Planned highlights include Marina coral safari, Snorkeling lagoons.

#### 27. Sakkara & Memphis Day Tour

- **Slug:** `sakkara-day-tour`
- **Category / location:** historical · Cairo, Sakkara
- **Duration:** 1 Day (1 itinerary day)
- **Starting price:** 70 — currency unconfirmed, see §A6
- **Cover image:** `/images/day-tours/sakkara-day-tour.jpeg`
- **Gallery:** 0 image(s) — _not present in the data model_
- **Map:** _not present in the data model_
- **Highlights:** Step Pyramid of Djoser; Memphis; Dahshur Pyramids
- **Inclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Exclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Source match:** `category` — https://egyptonlinetour.com/tours/giza-pyramids-and-sakkara-tour
- **Pickup / drop-off:** Hotel pickup and return in Cairo
- **Availability:** Daily
- **Sourced notes:** Optional experiences such as camel rides or pyramid-interior entry carry separate fees.
- **Accommodation level:** renders "Return arrangements to be confirmed" — tier and properties confirmed in the written quotation
- **Cancellation / policy version:** global `2026-08-13`; partner standard schedule on /policies; tour-specific terms in the written quotation

**Destinations and stops as rendered:**

- **Day 1 — Full Day Experience: Sakkara & Memphis Day Tour**
  - Summary: This part of Sakkara & Memphis Day Tour is planned around full day experience: sakkara & memphis day tour. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Return arrangements to be confirmed
  - Step Pyramid of Djoser
  - Memphis  ← _generic copy_
  - Dahshur Pyramids  ← _generic copy_

_Summary line rendered on cards:_ Explore Cairo, Sakkara on this 1 day historical itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services. Planned highlights include Step Pyramid of Djoser, Memphis, Dahshur Pyramids.

#### 28. Dahshur Pyramids Day Tour

- **Slug:** `dahshur-day-tour`
- **Category / location:** historical · Cairo, Dahshur
- **Duration:** 1 Day (1 itinerary day)
- **Starting price:** 65 — currency unconfirmed, see §A6
- **Cover image:** `/images/day-tours/dahshur-day-tour.jpeg`
- **Gallery:** 0 image(s) — _not present in the data model_
- **Map:** _not present in the data model_
- **Highlights:** Bent Pyramid; Red Pyramid
- **Inclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Exclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Source match:** unmapped — no reliable source page; fallback wording shown
- **Pickup / drop-off:** ⚠️ **OWNER INPUT REQUIRED** — confirmed in the written quotation
- **Availability:** on request — confirmed in the written quotation
- **Accommodation level:** renders "Return arrangements to be confirmed" — tier and properties confirmed in the written quotation
- **Cancellation / policy version:** global `2026-08-13`; partner standard schedule on /policies; tour-specific terms in the written quotation

**Destinations and stops as rendered:**

- **Day 1 — Full Day Experience: Dahshur Pyramids Day Tour**
  - Summary: This part of Dahshur Pyramids Day Tour is planned around full day experience: dahshur pyramids day tour. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Return arrangements to be confirmed
  - Bent Pyramid  ← _generic copy_
  - Red Pyramid  ← _generic copy_

_Summary line rendered on cards:_ Explore Cairo, Dahshur on this 1 day historical itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services. Planned highlights include Bent Pyramid, Red Pyramid.

#### 29. Egyptian Museum Day Tour

- **Slug:** `egyptian-museum-day-tour`
- **Category / location:** historical · Cairo
- **Duration:** 1 Day (1 itinerary day)
- **Starting price:** 55 — currency unconfirmed, see §A6
- **Cover image:** `/images/day-tours/egyptian-museum-day-tour.jpeg`
- **Gallery:** 0 image(s) — _not present in the data model_
- **Map:** _not present in the data model_
- **Highlights:** Tutankhamun treasures; Royal Mummies Hall
- **Inclusions:** sourced from the matched partner page — Modern air-conditioned vehicle; Entrance fees to the sites in the program; Expert tour guide; All service charges and taxes
- **Exclusions:** sourced from the matched partner page — Tipping
- **Source match:** `partial` — https://egyptonlinetour.com/tours/egyptian-museum-citadel
- **Pickup / drop-off:** Hotel pickup and return
- **Availability:** on request — confirmed in the written quotation
- **Accommodation level:** renders "Return arrangements to be confirmed" — tier and properties confirmed in the written quotation
- **Cancellation / policy version:** global `2026-08-13`; partner standard schedule on /policies; tour-specific terms in the written quotation

**Destinations and stops as rendered:**

- **Day 1 — Full Day Experience: Egyptian Museum Day Tour**
  - Summary: This part of Egyptian Museum Day Tour is planned around full day experience: egyptian museum day tour. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Return arrangements to be confirmed
  - Tutankhamun treasures  ← _generic copy_
  - Royal Mummies Hall  ← _generic copy_

_Summary line rendered on cards:_ Explore Cairo on this 1 day historical itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services. Planned highlights include Tutankhamun treasures, Royal Mummies Hall.

#### 30. White Desert Day Tour

- **Slug:** `white-desert-day-tour`
- **Category / location:** adventure · Bahariya, Western Desert
- **Duration:** 1 Day (1 itinerary day)
- **Starting price:** 130 — currency unconfirmed, see §A6
- **Cover image:** `/images/day-tours/white-desert-day-tour.jpeg`
- **Gallery:** 0 image(s) — _not present in the data model_
- **Map:** _not present in the data model_
- **Highlights:** White Desert chalk formations; Crystal Mountain; Black Desert
- **Inclusions:** sourced from the matched partner page — Hotel pickup and drop-off; Private air-conditioned vehicle and 4×4 desert jeep; National park entrance fees; Lunch during the tour; Cold water during the day and dinner on the return drive
- **Exclusions:** sourced from the matched partner page — Personal expenses; Travel insurance
- **Source match:** `exact` — https://egyptonlinetour.com/tours/day-trip-to-white-desert
- **Pickup / drop-off:** Pickup from and drop-off at your hotel
- **Availability:** on request — confirmed in the written quotation
- **Sourced notes:** The route takes in the Black Desert, Cold Spring, Crystal Mountain, Agabat Valley, and the New White Desert, ending with the desert sunset. · Desert terrain means long off-road driving — tell us about back, mobility, or motion-sickness concerns before booking.
- **Accommodation level:** renders "Return arrangements to be confirmed" — tier and properties confirmed in the written quotation
- **Cancellation / policy version:** global `2026-08-13`; partner standard schedule on /policies; tour-specific terms in the written quotation

**Destinations and stops as rendered:**

- **Day 1 — Full Day Experience: White Desert Day Tour**
  - Summary: This part of White Desert Day Tour is planned around full day experience: white desert day tour. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Return arrangements to be confirmed
  - White Desert chalk formations  ← _generic copy_
  - Crystal Mountain  ← _generic copy_
  - Black Desert  ← _generic copy_

_Summary line rendered on cards:_ Explore Bahariya, Western Desert on this 1 day adventure itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services. Planned highlights include White Desert chalk formations, Crystal Mountain, Black Desert.

#### 31. Philae Temple Day Tour

- **Slug:** `philae-temple-day-tour`
- **Category / location:** historical · Aswan
- **Duration:** 1 Day (1 itinerary day)
- **Starting price:** 60 — currency unconfirmed, see §A6
- **Cover image:** `/images/day-tours/philae-temple-day-tour.jpeg`
- **Gallery:** 0 image(s) — _not present in the data model_
- **Map:** _not present in the data model_
- **Highlights:** Philae Temple; Kiosk of Trajan
- **Inclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Exclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Source match:** `partial` — https://egyptonlinetour.com/tours/philae-temple-high-dam-and-obelisk-private-tour
- **Pickup / drop-off:** Pickup and drop-off at your Aswan hotel
- **Availability:** Daily
- **Sourced notes:** Philae Temple sits on an island and is reached by motorboat — the crossing is part of the visit.
- **Accommodation level:** renders "Return arrangements to be confirmed" — tier and properties confirmed in the written quotation
- **Cancellation / policy version:** global `2026-08-13`; partner standard schedule on /policies; tour-specific terms in the written quotation

**Destinations and stops as rendered:**

- **Day 1 — Full Day Experience: Philae Temple Day Tour**
  - Summary: This part of Philae Temple Day Tour is planned around full day experience: philae temple day tour. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Return arrangements to be confirmed
  - Philae Temple
  - Kiosk of Trajan  ← _generic copy_

_Summary line rendered on cards:_ Explore Aswan on this 1 day historical itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services. Planned highlights include Philae Temple, Kiosk of Trajan.

#### 32. Valley of the Kings Day Tour

- **Slug:** `valley-of-kings-day-tour`
- **Category / location:** historical · Luxor
- **Duration:** 1 Day (1 itinerary day)
- **Starting price:** 75 — currency unconfirmed, see §A6
- **Cover image:** `/images/day-tours/valley-of-kings-day-tour.jpeg`
- **Gallery:** 0 image(s) — _not present in the data model_
- **Map:** _not present in the data model_
- **Highlights:** Royal tombs; Tomb of Tutankhamun
- **Inclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Exclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Source match:** `partial` — https://egyptonlinetour.com/tours/luxor-west-bank-tour-private-day-trip
- **Pickup / drop-off:** Pickup and drop-off at your Luxor hotel or Nile cruise
- **Availability:** Daily
- **Sourced notes:** The standard Valley of the Kings ticket covers selected open tombs; famous tombs such as Tutankhamun, Seti I, and Ramesses V/VI require separate tickets. · Early-morning departures (around 5:00 AM) are typical for the West Bank. · Some tombs have steep stairs, narrow passages, and warm interiors — mention mobility, breathing, or claustrophobia concerns when inquiring.
- **Accommodation level:** renders "Return arrangements to be confirmed" — tier and properties confirmed in the written quotation
- **Cancellation / policy version:** global `2026-08-13`; partner standard schedule on /policies; tour-specific terms in the written quotation

**Destinations and stops as rendered:**

- **Day 1 — Full Day Experience: Valley of the Kings Day Tour**
  - Summary: This part of Valley of the Kings Day Tour is planned around full day experience: valley of the kings day tour. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Return arrangements to be confirmed
  - Royal tombs  ← _generic copy_
  - Tomb of Tutankhamun  ← _generic copy_

_Summary line rendered on cards:_ Explore Luxor on this 1 day historical itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services. Planned highlights include Royal tombs, Tomb of Tutankhamun.

#### 33. Karnak Temple Day Tour

- **Slug:** `karnak-temple-day-tour`
- **Category / location:** historical · Luxor
- **Duration:** 1 Day (1 itinerary day)
- **Starting price:** 65 — currency unconfirmed, see §A6
- **Cover image:** `/images/day-tours/karnak-temple-day-tour.jpeg`
- **Gallery:** 0 image(s) — _not present in the data model_
- **Map:** _not present in the data model_
- **Highlights:** Great Hypostyle Hall; Avenue of Sphinxes; Sacred Lake
- **Inclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Exclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Source match:** `partial` — https://egyptonlinetour.com/tours/tour-of-the-east-bank-in-luxor-private-trip
- **Pickup / drop-off:** Pickup and drop-off at your Luxor hotel or Nile cruise
- **Availability:** Daily
- **Sourced notes:** Meals and drinks are not included on the partner’s East Bank trip; optional upgrades can be arranged.
- **Accommodation level:** renders "Return arrangements to be confirmed" — tier and properties confirmed in the written quotation
- **Cancellation / policy version:** global `2026-08-13`; partner standard schedule on /policies; tour-specific terms in the written quotation

**Destinations and stops as rendered:**

- **Day 1 — Full Day Experience: Karnak Temple Day Tour**
  - Summary: This part of Karnak Temple Day Tour is planned around full day experience: karnak temple day tour. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Return arrangements to be confirmed
  - Great Hypostyle Hall  ← _generic copy_
  - Avenue of Sphinxes  ← _generic copy_
  - Sacred Lake  ← _generic copy_

_Summary line rendered on cards:_ Explore Luxor on this 1 day historical itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services. Planned highlights include Great Hypostyle Hall, Avenue of Sphinxes, Sacred Lake.

#### 34. Nile Felucca Day Tour

- **Slug:** `nile-cruise-day-tour`
- **Category / location:** cultural · Luxor, Aswan
- **Duration:** 1 Day (1 itinerary day)
- **Starting price:** 50 — currency unconfirmed, see §A6
- **Cover image:** `/images/day-tours/nile-cruise-day-tour.jpeg`
- **Gallery:** 0 image(s) — _not present in the data model_
- **Map:** _not present in the data model_
- **Highlights:** Traditional felucca sail; Nile sunset
- **Inclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Exclusions:** generic boilerplate — see §A10; confirmed in the written quotation
- **Source match:** unmapped — no reliable source page; fallback wording shown
- **Pickup / drop-off:** ⚠️ **OWNER INPUT REQUIRED** — confirmed in the written quotation
- **Availability:** on request — confirmed in the written quotation
- **Accommodation level:** renders "Return arrangements to be confirmed" — tier and properties confirmed in the written quotation
- **Cancellation / policy version:** global `2026-08-13`; partner standard schedule on /policies; tour-specific terms in the written quotation

**Destinations and stops as rendered:**

- **Day 1 — Full Day Experience: Nile Felucca Day Tour**
  - Summary: This part of Nile Felucca Day Tour is planned around full day experience: nile felucca day tour. The final order and timing may change with opening hours, transport, and local conditions.
  - Meals: As stated in the final quotation
  - Overnight: Return arrangements to be confirmed
  - Traditional felucca sail  ← _generic copy_
  - Nile sunset  ← _generic copy_

_Summary line rendered on cards:_ Explore Luxor, Aswan on this 1 day cultural itinerary. Review the day-by-day plan and indicative price, then request a written quotation confirming all included and excluded services. Planned highlights include Traditional felucca sail, Nile sunset.

---

## Section C — Policy and privacy approval checklist

The Policies page now carries eleven sections sourced from the partner's published Terms and
Privacy Policy (see `HEAD_COMPANY_SOURCE_MATRIX.md`): Inquiry and confirmation; Payment through
our travel partner; Standard cancellation schedule; Changes to your booking; Children and
families; Accommodation; Travel documents, visas, and insurance; Complaints and claims;
Liability and third-party suppliers; Special requests, accessibility, and health; Privacy.
Partner terms are attributed to Egypt Online Tour as its standard terms — Travision is the
inquiry interface. Per the owner decision, there is no universal child, accommodation, or
cancellation policy: each section that could read as universal carries the required disclaimer
that reservation-specific conditions arrive in the personalized written quotation and policy
PDF before payment (template: `templates/quotation-policy-template.html`). The following items
are either absent or still need owner/legal sign-off.

| Item | Status |
|---|---|
| Business identity and contact/address details | **Absent.** No registered entity name or postal address appears anywhere. |
| Data-controller / contact information | **Partial.** Contact routes exist (form + phone); no controller identity or address. |
| Purposes for collected data | Present — responding, quoting, coordinating services, records. |
| Lawful basis | **Absent.** No lawful basis is stated. |
| Retention period | **Absent.** No retention period is stated. |
| Data sharing with the partner and service providers | Present — partner named; suppliers (hotels, airlines, guides) described as needed to deliver the booking. |
| Cross-border data handling | **Absent.** |
| Access / correction / deletion rights and process | Present — visitors may ask to access, correct, or delete inquiry data via form or phone; partner-held data referred to the partner's privacy contact. |
| Cookie and analytics disclosures | **Absent, and now known.** The site sets no first-party cookies and runs no analytics. Third parties that may set their own: Cloudflare Turnstile (form protection) and Google Maps frames. Tour images are locally hosted. |
| Governing law and dispute wording | **Absent.** The partner's terms do not publish a governing-law clause, so none was imported. |
| Payment methods and recipient | Present — no payments or card details on this site; Visa, Mastercard, Apple Pay, and wire transfer are paid directly to the partner after the written quotation. |
| Deposit and balance | Present — partner standard terms: 40% deposit, balance 30 days before departure, full payment inside 30 days. |
| Cancellation / refund schedule | Present — partner standard tiers published with the explicit caveat that the written quotation governs per product. |
| Changes by customer / operator | Present — free before booking; US$25 + third-party charges after deposit; operator substitution and cancellation-refund terms stated. |
| No-show and unused services | Present — full charge on no-show; no refund for unused services after the trip starts. |
| Complaints window | Present — raise during travel; written claims within 15 days of tour end. |
| Force majeure and liability | Present — summarised, attributed to the partner's terms. |
| Final quotation and tour-specific terms | Deferred to the written quotation by design; stated on /policies and on every tour page. |
| Owner/legal sign-off on the published partner-terms wording | **Required before launch** — the paraphrased terms preserve meaning but have not been legally reviewed. |

## Section D — Decisions required from the owner

| # | Decision | Why it blocks |
|---|---|---|
| 1 | Confirm the display currency (USD assumed) or choose another | The format is now unified via `formatUsd()` (§A6); the currency itself is still unconfirmed |
| 2 | Supply copy for the 51 distinct attractions/activities with no approved text | 65 stops still render the generic sentence (§A3b). The 13 naming variants are already aliased (§A3a) |
| 3 | Confirm the contact mailbox is live, then flip `EMAIL_PUBLISHED` to `true` | The address is suppressed site-wide until then (§A8) |
| 4 | ~~Substantiate or remove the rating and review-count values~~ — RESOLVED | Removed from the data model; no component can surface them (§A5) |
| 5 | ~~Blog — publish real articles or hide the route~~ — RESOLVED | 5 articles published; route is public and in the sitemap (§A4) |
| 6 | Approve the policy items in Section C | Acceptance criterion: owner signs off on policies |
| 7 | ~~Provide pickup/drop-off, accessibility, availability and accommodation level~~ — PARTIALLY RESOLVED | Sourced for 11 exact + 11 partial/category matches; 12 tours remain unmapped and need owner input or a partner data sheet (Section B) |
| 8 | ~~Replace the White Desert placeholder and six remote Red Sea covers~~ — RESOLVED | Seven original destination-specific covers are now locally hosted and optimized (§B) |


## Section E — CMS seed parity (admin dashboard pass)

| Check | Result |
|---|---|
| Seed idempotency | `npm run cms:seed` twice → `ON CONFLICT DO NOTHING`, identical row counts (34 tours, 5 posts) |
| Source → database reconciliation | `Source: 12 packages + 22 day tours + 5 posts` vs `Database: 34 tour rows, 5 post rows` — parity |
| `npm run cms:validate` | 0 errors, 34 warnings (pre-existing missing `meta_description` values — operator quality queue, not defects) |
| `npm run cms:export` → `npm run cms:diff` | `0 difference(s)` between published CMS rows and the static sources |
| Existing IDs preserved | All ids — including the legacy double-dash id `pkg-7-5-days-cairo--luxor---abu-simbel-tour` — pass validation unchanged |
