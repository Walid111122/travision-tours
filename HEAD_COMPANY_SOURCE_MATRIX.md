# Head-Company Source Matrix — Egypt Online Tour

Evidence record for all facts imported into Travision Tours from the head/referral
company **Egypt Online Tour** (`https://egyptonlinetour.com/`).

- **Date accessed:** 2026-09-16
- **Purpose:** satisfy the pre-domain requirement that every policy, child,
  accommodation, logistics, or booking statement on travisiontours.com trace to an
  explicit source.
- **Standing rule:** a fact is applied only when Egypt Online Tour states it
  explicitly AND it clearly applies to the same tour, destination, or booking
  category. Unmatched fields stay unresolved and are listed in `CONTENT_GAPS.md`.
- **Entity separation:** everything below describes *Egypt Online Tour* — the
  head/referral company, operator, and payment recipient. Travision Tours is the
  customer-facing inquiry website only; it does not collect payments, card
  details, or customer funds.

## Domain disambiguation (important)

| Domain | Operator | Usable as source? |
|---|---|---|
| `egyptonlinetour.com` | **Egypt Online Tour** (Nasr City, Cairo; licensed 2006; IATA member per `/about`) | Yes — canonical head-company site |
| `egyptonlinetours.com` / `beta.egyptonlinetours.com` | **Maestro Online Travel Egypt** (different company; different TripAdvisor ID `d2164784` vs EOT's `d13557332`) | **No** — despite the near-identical domain, this is a different legal entity. Its "children 2–12 get 50% discount" and occupancy rules were found in search results and are **rejected** as a Travision source. |

---

## A. General policy sources

| # | Source URL | Page title | Fact supported | Where used on Travision | Scope | Ambiguity / conflict |
|---|---|---|---|---|---|---|
| A1 | `/terms` | Terms of Services | 40% deposit at booking; balance due 30 days before departure; bookings inside 30 days require full payment | Policies → Deposit & balance | General (EOT standard) | Per-product overrides possible — quotation governs |
| A2 | `/terms` | Terms of Services | Payment methods: Visa/Mastercard secure online payment, Visa/Mastercard by email, wire transfer; site footer also shows Apple Pay + Google Pay | Policies → Payment methods | General | Owner's agreed set is Visa, Mastercard, Apple Pay, wire transfer — keep owner's list (a subset of what EOT advertises), not EOT's exact list |
| A3 | `/terms` | Terms of Services | Cancellation schedule: ≥22 days 100% refund; 15–21 days 70%; 8–14 days 50%; 0–7 days no refund; no-show charged 100%; no refund for unused services after trip start; special-event hotel/cruise deposits may be non-refundable; groups >10 case-by-case | Policies → Cancellation & refunds | General (EOT standard) | **Conflicts with /faqs** which says "free cancellation up to 24–48h before tour start for most tours". `/terms` is the formal document; flagged for owner/legal confirmation |
| A4 | `/terms` | Terms of Services | Itinerary alterations free before booking; $25 per request after deposit; third-party alteration costs are the customer's | Policies → Changes by customer | General | "before the booking" wording preserved; flagged for legal review |
| A5 | `/terms` | Terms of Services | Passport/visas/permits are the client's sole responsibility; advisor may assist on request; EOT not liable for documentation failures | Policies → Travel documents | General | — |
| A6 | `/terms` | Terms of Services | Complaints: notify advisor during trip; written claim within 15 days of tour end with receipts; later claims not accepted | Policies → Complaints | General | — |
| A7 | `/terms` | Terms of Services | If no reply within 48h of a booking/modify/cancel request, contact customer service | Policies → Booking process | General | — |
| A8 | `/terms` | Terms of Services | Liability: not liable for third-party info errors, force majeure events (weather, strikes, epidemics, government acts, etc.); right to substitute hotels/flights/trains/cruise ships and alter itineraries; if EOT cancels before tour start → full refund; activities at own risk; right to refuse service for illegal/objectionable behaviour; right to modify terms | Policies → Operator changes, Force majeure, Liability | General | Material legal terms — owner/legal sign-off required |
| A9 | `/privacy` | Privacy Policy | Collects name, email, phone, passport details, payment information when booking; used to process bookings, communicate, send offers (with consent), improve services; shared only with fulfilling providers (hotels, airlines, guides) and as required by law; access/correct/delete rights via privacy@egyptonlinetour.com; cookies used | Policies → Privacy & data | General | Travision collects *inquiry* data only (no passport/payment); wording adapted to say inquiry data is shared with EOT to fulfil bookings. Retention period NOT stated — flagged |
| A10 | `/faqs` | Egypt Tour FAQs | Packages "typically include" accommodation, transport, licensed-Egyptologist guiding, entrance fees to listed sites, specified meals; international flights usually excluded | Policies → What's typically included | General | "Typically" — per-product quotation still governs |
| A11 | `/faqs` | Egypt Tour FAQs | **"Free cancellation up to 24–48 hours before the tour start for most tours"** | NOT published | — | **Direct conflict with A3 tiered schedule.** Unresolved pending owner/legal decision; recorded in CONTENT_GAPS |
| A12 | `/faqs` | Egypt Tour FAQs | Visa: most nationalities need one; ~US$25 visa-on-arrival for many; e-visa for some | Policies → Travel documents (guidance only) | General | Priced guidance only; requirements change — phrased as "check latest requirements" |
| A13 | `/customize` | Customize My Trip | Custom-tour form fields: Children (under 12); accommodation preferences Budget (3★), Standard (4★), Luxury (5★), Mixed, Flexible; pace options; dietary + mobility special requests | Child policy model; accommodation preference model; Policies → Special requests | General | Establishes category vocabulary, not per-tour policy |
| A14 | `/about` | About Us | EOT licensed 2006; Nasr City, Cairo; IATA member | NOT published as Travision fact | — | EOT's credentials; must not be re-attributed to Travision |
| A15 | `/contact`, site footer | Contact | EOT contacts: +20 127 450 3634, contact@egyptonlinetour.com, WhatsApp | Policies → partner contact (in complaints context) | General | Travision keeps its own phone; EOT contact shown only where payment/complaint escalation is discussed |
| A16 | `/terms` | Terms of Services | **No governing-law clause, no travel-insurance requirement, no deposit-percentage variance by product, no data-retention period stated** | CONTENT_GAPS | — | Remain owner/legal decisions |

## B. Tour-category patterns (repeated across ≥4 fetched EOT pages)

| # | Pattern | Pages exhibiting it | Applied to | Scope |
|---|---|---|---|---|
| B1 | Private day tours: daily availability, hotel pickup & drop-off, private air-conditioned vehicle, licensed/English-speaking Egyptologist guide, entrance fees to listed sites included, bottled water, taxes/service charges included; excluded: tips, personal expenses, insurance | old-cairo-tour; exciting-private-day-trip-of-giza; giza-pyramids-and-sakkara-tour; private-tour-to-abu-simbel-from-aswan; philae-temple-high-dam-obelisk; luxor-west-bank-tour; tour-of-the-east-bank; alexandria-archeological-day-tour; pyramids-and-saqqara-day-tour | Category-level fallback for mapped private day tours only | Booking-category pattern |
| B2 | Pickup "from your hotel or Nile cruise" | luxor-west-bank-tour; tour-of-the-east-bank; private-tour-to-abu-simbel (hotel or cruise drop-off) | Luxor/Aswan-based mapped tours | Category |
| B3 | Early-morning departures for Luxor/Abu Simbel (~5:00 AM) | luxor-west-bank-tour; tour-of-the-east-bank; luxor-day-tour-from-aswan | Mapped Luxor tours only | Tour-specific |
| B4 | "Accommodation" tier label on detail box (Comfort/Standard/Luxury) + 4-tier package choice (Standard/Premium/Luxury/High End: same experiences, different accommodation level) | All package + day-tour pages | Accommodation UI vocabulary | General |
| B5 | Booking form age bands: **Adults (+12), Children (1–11)** | All tour/package inquiry forms; /customize uses "under 12" | Child-policy model | General |
| B6 | "Family Friendly: Yes" badge on detail box | All fetched tour pages | Child-suitability signal only | Per-page |
| B7 | "Free Cancellation (24h)" + "Instant Confirmation" badges on inquiry form | All fetched tour pages | **NOT imported** — contradicts /terms tiered schedule (A11 conflict) | — |
| B8 | Check-in typically after 2 PM / check-out before 12 noon; early/late may cost half or full day | 8-days-pyramids-the-nile-by-air (includes) | Accommodation general note | Category — single source page; applied as "typical" wording pending owner confirm |
| B9 | Visa inclusion varies by package (included on 8-days page; excluded on 15-days page) | Both package pages | Per-package exclusions stay quotation-level | Noted variance |

## C. Tour-by-tour mapping

Match = same duration + same destination set + same product type.
Partial = overlapping scope; only explicitly shared facts may be reused.
No match = field stays unresolved.

### Packages (SAMPLE_TOURS)

| Travision tour | Travision scope | EOT source page | Match | Facts adopted |
|---|---|---|---|---|
| `4-days-cairo-giza-pyramids-tour` | 4d/3n Cairo only: Giza, GEM, Saqqara, Egyptian Museum, Citadel, NMEC, Muizz, Khan | none found (nearest: `5-days-cairo-tour-pyramids-museums-local-life`, 5d) | **No match** | none |
| `pkg-7-5-days-cairo--luxor---abu-simbel-tour` | 5d/4n Cairo→Abu Simbel→Luxor private | `tours/5-days-cairo-luxor-abu-simbel-tour` | **Match** | Airport meet/assist; private A/C transfers; domestic flights Cairo→Aswan + Luxor→Cairo; first-class train Aswan→Luxor; private Egyptologists; entry fees; breakfast box for early Abu Simbel; excludes int'l flights/visa/insurance/tips/interior pyramid ticket/special tomb tickets/early check-in |
| `6-days-cairo-luxor-aswan` | 6d/5n Cairo+Luxor+Aswan+Abu Simbel | `tours/6-days-cairo-luxor-aswan-abu-simbel-package` | **Match** | Accommodation: 5★ hotels — 2n Cairo + 2n Luxor + 1n Aswan; meet/assist; private transfers; flight Cairo→Luxor + Aswan→Cairo; first-class train Luxor→Aswan; motorboat crossing Luxor + Philae boat; Nile dinner cruise; daily breakfast, lunch on sightseeing days; excludes visa/insurance/drinks/optional/pyramid-interior/special tombs/early check-in/late check-out/tips |
| `7-days-cairo-luxor-aswan-abu-simbel-edfu-kom-ombo` | 7d/6n overland: Luxor→Edfu/Kom Ombo→Abu Simbel→Aswan | `tours/7-day-egypt-tour-cairo-nile-cruise-and-luxor-temples` (cruise-based, **no Abu Simbel**) | **No match** (different product structure) | none |
| `8-days-budget-egypt-complete-tour` | 8d/7n Cairo + Nile cruise | `tours/8-days-pyramids-the-nile-by-air` | **Match** | 3n Cairo hotel B&B + 4n full-board 5★ Superior Nile cruise; EgyptAir domestic flights; English-speaking guide; private Cairo sightseeing + cruise excursions; visa included *on that product* (variance noted B9); check-in ~2pm/out ~12pm (B8); excludes int'l airfare/optional/personal/tipping |
| `9-days-cairo-alexandria-luxor-aswan-trip` | 9d/8n Cairo+Alex+Luxor+Aswan+Abu Simbel | none covering all four cities in 9 days | **No match** | none |
| `12-days-family-egypt-red-sea-holiday` | 12d/11n Cairo+cruise route+Hurghada (snorkel+safari) | `tours/12-days-luxury-cairo-the-nile-red-sea` | **Partial** | Category pattern only: package combines Cairo hotel nights + 5★ full-board Nile cruise nights + Hurghada resort nights + domestic flights + diving/snorkeling inclusions. Night split differs — not copied. Travision's includes Abu Simbel; EOT's does not. |
| `14-days-trip-to-the-best-of-egypt` | 14d/13n Cairo+Hurghada+Luxor+Edfu/Kom Ombo+Aswan+Abu Simbel+Alex | none (nearest `14-days-dahabiya-yacht-pharaohs-adventure-tour` is Dahabiya-based) | **No match** | none |
| `15-days-marvelous-egypt-tour-package` | 15d/14n private: Cairo+Alex+Aswan+Abu Simbel+Edfu/Kom Ombo+Luxor+Hurghada | `tours/15-days-marvelous-tour-package-in-egypt` | **Partial** | Accommodation-tier model (Standard/Premium/Luxury/High End — same experiences, different hotel levels); 4-tier form options. EOT product is group + Dahabiya + Fayoum, Travision's is private + Hurghada — itinerary/named hotels NOT copied. |

### Day trips in packages file

| Travision tour | Travision scope | EOT source page | Match | Facts adopted |
|---|---|---|---|---|
| `pyramids-tour-from-cairo-airport` | 1d layover: Giza+Sphinx+Valley+GEM+lunch, from airport | `tours/cairo-layover-tour` | **Match** | 6–12h duration, availability follows flight schedule, private A/C airport transfers, English-speaking Egyptologist, admission tickets included, visa excluded |
| `day-trip-to-giza-pyramids-from-cairo` | 1d Giza+Sphinx+Valley+lunch+Saqqara from Cairo | `tours/pyramids-and-saqqara-day-tour-in-cairo` | **Match** | Daily; hotel pickup; private A/C car/van; professional Egyptology guide; admissions to itinerary attractions + taxes included; excludes visa/personal/optional/tips. (EOT page also includes Memphis — noted as source-only extra) |
| `tour-to-giza-pyramids-old-cairo` | 1d Giza+Museum+Muizz+Khan | `tours/egyptian-museum-old-cairo-tour` lacks Giza leg | **Partial** | Category pattern B1 only |

### Day tours (DAY_TOURS)

| Travision tour | Travision scope | EOT source page | Match | Facts adopted |
|---|---|---|---|---|
| `cairo-day-tour` | Giza+Sphinx+Egyptian Museum | none with that exact trio | **Partial** | Category pattern B1 |
| `giza-pyramids-day-tour` | Pyramids+Sphinx+Valley+optional camel | `tours/exciting-private-day-trip-of-giza` | **Match** | Daily; pickup/drop-off Cairo or Giza hotel; private A/C; English-speaking Egyptologist; entrance fees + bottled water; ~8 AM–4 PM window; excludes tips/personal/insurance; **pyramid-interior ticket is an optional extra (~$80), guides don't go inside**; camel ride optional extra |
| `luxor-day-tour` | VoK+Hatshepsut+Karnak (both banks) | `luxor-day-tour-from-aswan` is Aswan→Luxor (~13h, 5 AM); bank-split pages exist separately | **Partial** | Category patterns B1+B2 (hotel or Nile-cruise pickup in Luxor); pickup city NOT asserted |
| `aswan-day-tour` | High Dam+Unfinished Obelisk+Philae | `tours/philae-temple-high-dam-and-obelisk-private-tour` | **Match** | Daily; Aswan hotel pickup/drop-off; private guided; private A/C car; entry fees + taxes included; lunch optional; excludes tips/personal |
| `abu-simbel-day-tour` | Ramses II + Nefertari temples | `tours/private-tour-to-abu-simbel-from-aswan-by-car` | **Match** | Daily; Aswan hotel pickup, drop-off at hotel or Nile cruise; private A/C vehicle; private guide; entry tickets + taxes; family-friendly per source |
| `alexandria-day-tour` | Bibliotheca+Qaitbay+Catacombs | `tours/alexandria-archeological-day-tour-top-sites` | **Match** | Daily; hotel pickup/drop-off; private A/C transport; expert guide; sites include catacombs, Roman amphitheatre, Pompey's Pillar, Bibliotheca, Qaitbay, Montazah, Stanley Bridge |
| `old-cairo-day-tour` | Hanging Church+Coptic Museum+Ben Ezra+Khan | `tours/old-cairo-tour` | **Match** | Daily; Cairo hotel pickup/drop-off; private; English-speaking guide; entrance fees; A/C vehicle; mineral water; taxes; excludes personal/gratuities/insurance. (EOT adds Citadel+Alabaster Mosque — source-only extra.) `day-tour-to-old-cairo-visit-ben-ezra-synagogue` rejected: page title says 1 day, metadata says 2d/1n — contradictory |
| `hurghada-day-tour` | Giftun Island snorkel + reefs | none (EOT Hurghada pages: submarine, Luxor-by-flight, Cairo-by-flight — different products) | **No match** | none |
| `sharm-el-sheikh-day-tour` | Ras Mohammed + desert safari + beaches | `tours/ras-mohamed-boat-trip-white-island` | **Partial** | Boat-trip facts only where they overlap: daily; Sharm hotel pickup/drop-off; A/C transfer to marina; Ras Mohammed park entrance included; snorkel gear (mask/fins/life jacket) included; lunch on board; water/soft drinks; excludes optional/personal/tips/visa/flights. Desert-safari component unsourced |
| `marsa-alam-day-tour` | Sataya/Samadai snorkel | none in sitemap | **No match** | none |
| `el-gouna-day-tour` | Lagoon boat + snorkel | none | **No match** | none |
| `makadi-bay-day-tour` | House reef + semi-submarine | none (`semi-submarine-tour-from-safaga-port` is a different port) | **No match** | none |
| `soma-bay-day-tour` | Tobia Islands + kitesurf | none | **No match** | none |
| `port-ghalib-day-tour` | Marina coral safari | none | **No match** | none |
| `sakkara-day-tour` | Step Pyramid+Memphis+Dahshur | `giza-pyramids-and-sakkara-tour` (adds Giza, no Dahshur) | **Partial** | Category pattern B1; admission scope differs — not asserted |
| `dahshur-day-tour` | Bent+Red Pyramids | none | **No match** | none |
| `egyptian-museum-day-tour` | Museum only | `egyptian-museum-citadel` (adds Citadel+Khan) | **Partial** | Category pattern B1; A/C van, entrance fees to *mentioned* sites, expert guide, taxes; excludes tipping |
| `white-desert-day-tour` | White Desert+Crystal Mtn+Black Desert | `tours/day-trip-to-white-desert` | **Match** | 1 day; hotel pickup/drop-off; private A/C + 4×4 jeep with desert captain; national-park entrance fees; lunch included; cold water; dinner on return; Black Village, Cold Spring, Crystal Mountain, Agabat Valley, New White Desert, sunset; excludes personal/insurance |
| `philae-temple-day-tour` | Philae only | `philae-temple-high-dam-and-obelisk` (3 stops) | **Partial** | Category pattern B1 + Aswan hotel pickup (B2) |
| `valley-of-kings-day-tour` | VoK only | `luxor-west-bank-tour` (VoK+Hatshepsut+Colossi) | **Partial** | B1+B2; ~5 AM start (B3); **VoK standard ticket covers selected open tombs; Tutankhamun/Seti I/Ramses V-VI need separate tickets** (from 6-days package text) |
| `karnak-temple-day-tour` | Karnak only | `tour-of-the-east-bank-in-luxor-private-trip` (Karnak+Luxor) | **Partial** | B1+B2; meals/drinks excluded or optional per source |
| `nile-cruise-day-tour` | Felucca sail + sunset | none (`dinner-cruise-on-the-nile` is a different product) | **No match** | none |

## D. Child policy — what the source actually supports

| Fact | Source | Status |
|---|---|---|
| Age bands on inquiry forms: Adults (+12) / Children (1–11); /customize says "Children (under 12)" | All tour pages + /customize | **Adopted** — matches Travision's existing form bands |
| Child discount percentage | **Not published on egyptonlinetour.com.** The "2–12 → 50%" rule lives on `egyptonlinetours.com` = Maestro Online Travel (different company) | **Rejected / unresolved** — owner decision |
| Infant policy, own-seat rule, room-sharing, max occupancy, crib rules | Not published | **Unresolved** — owner input |
| Child meal needs accommodated on request | 6-days package ("Share any… child meal need before booking") | Adopted as a *request* channel, not a guarantee |
| "Family Friendly: Yes" marker | All fetched tour pages | Adopted as general suitability note for matched tours |
| Activities unsuitable for children | Not published | Unresolved |

## E. Accommodation — what the source supports

| Fact | Source | Status |
|---|---|---|
| Package tier model: Standard / Premium / Luxury / High End — same experiences, different accommodation levels | Package pages (15-days, and detail pages' Hotels & Accommodation tab) | Adopted as vocabulary + form options |
| /customize preference wording: Budget 3★ / Standard 4★ / Luxury 5★ / Mixed / Flexible | /customize | Adopted for the inquiry form's accommodation-preference field |
| 6-days package: 5★ hotels — 2n Cairo, 2n Luxor, 1n Aswan | 6-days page | Adopted for `6-days-cairo-luxor-aswan` (category level, no hotel names) |
| 8-days package: 3n Cairo hotel B&B + 4n full-board 5★ Superior Nile cruise | 8-days page | Adopted for `8-days-budget-egypt-complete-tour` (category level; "Superior" is EOT's tier word, kept) |
| Named hotels/cruise vessels | Several pages list names per tier | **Not adopted** — EOT does not guarantee names; category-level wording only |
| Check-in ~2 PM / check-out ~noon; early/late may cost extra half/full day | 8-days page | Adopted as "typical" note |
| Single supplement / triple reduction | Not on canonical domain (only on rejected Maestro domain) | **Unresolved** — owner input |
| "Or similar" wording | Not used on fetched pages | **Not used** |

## F. Deliberately NOT imported

| Item | Reason |
|---|---|
| Ratings/review counts (e.g. "5.0 (33 reviews)") | Third-party review data — Travision has no review evidence; fields stay dead and are removed from the data model |
| "Free Cancellation (24h)" / "Instant Confirmation" badges | Conflict with /terms tiered schedule; and an inquiry is not a confirmed booking |
| EOT's founding year, license, IATA membership, address, phone | EOT legal identity — not Travision's |
| Prices from EOT pages | Travision keeps its own `price` values; no overwrites |
| Marketing superlatives ("best", "ultimate", "unforgettable") | Unverifiable promotion |
| Named hotels/cruises, Dahabiya product | Not guaranteed; different product structure |
| Google Pay (EOT footer) | Not in owner's agreed payment-method set |
