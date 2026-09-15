# Content & Logistics Gap Report

Owner-facing checklist distilled from `PHASE8_CONTENT_VALIDATION.md`
(regenerate with `npm run content:sheet`). Every item below requires owner
input — none of it can be written without business facts.

## 1. Missing on every tour (all 34)

Each tour detail page currently has nothing for the following. They are
marked `OWNER INPUT REQUIRED` per tour in the validation sheet (§B).

| Field | What is needed |
|---|---|
| Pickup / drop-off | Pickup points or zones, pickup times, whether airport pickup is included, any surcharge areas |
| Accessibility / physical requirements | Walking level, stairs/uneven ground, wheelchair access, fitness notes |
| Availability / schedule | Operating days of the week, blackout dates, seasonal differences, minimum group size if any |
| Child policy | **Not modeled anywhere in the data.** Child age brackets, reduced child pricing, infant policy, whether kids can join each tour |
| Meeting point (day tours) | Where the tour starts if pickup is not offered |

## 2. Package tours — accommodation

80 overnight stops across the 12 multi-day packages render
"Accommodation to be confirmed". Needed per night: hotel or cruise name,
or at minimum a star level / tier statement the owner is willing to commit
to.

## 3. Generic itinerary-stop copy — 65 stops remaining

The 13 title variants that duplicated already-approved copy are now
aliased (§A3a). 51 distinct attraction/activity titles across 65 stops
still render the generic fallback sentence and need owner-written copy
(§A3b lists each title). Worst-affected tours:

| Tour | Generic stops |
|---|---|
| `14-days-trip-to-the-best-of-egypt` | 10 |
| `9-days-cairo-alexandria-luxor-aswan-trip` | 8 |
| `15-days-marvelous-egypt-tour-package` | 4 |
| Day tours (Abu Simbel, Alexandria, Old Cairo, Hurghada, Sharm, Marsa Alam, El Gouna, Makadi, Soma Bay, Port Ghalib, Sakkara, Dahshur, Museum, White Desert, Karnak, Nile Felucca, Valley of Kings, Philae) | 1–3 each |

Day-level summaries ("This part of X is planned around…") are generated
filler and should also be replaced where the owner wants richer copy.

`Luxor Temple by Night` needs its own text — it must not reuse the
daytime `Luxor Temple` copy.

## 4. Image gaps

| Issue | Tours affected | Action |
|---|---|---|
| Placeholder cover (`/hero.jpg`) | `white-desert-day-tour` | Owner is supplying the photo |
| Remote Unsplash stock photos | `sharm-el-sheikh`, `marsa-alam`, `el-gouna`, `makadi-bay`, `soma-bay`, `port-ghalib` day tours | Replace with owned/local photos. These are hot-linked generic beach shots that may not depict the named resort, and they add a third-party request |

Audit of what exists: 104 local tour images verified on disk — zero
broken references, no cross-tour duplicates (each tour's cover
intentionally repeats as `gallery[0]`), and no extreme aspect ratios that
would crop badly. Subject-level cropping and photo-to-tour relevance still
need a human eyeball pass — a script cannot judge whether a photo shows
the right site.

## 5. Ratings and review counts

Every tour carries `rating` / `reviewsCount` values in the data, but
nothing renders them and they are stripped from the sanitized export — so
visitors never see them today. Owner decision: substantiate them with real
reviews or delete the fields. (§A5)

## 6. Global blockers (full detail in the sheet)

- **Currency** — display format is now unified (`US$1,070`), but the
  currency itself is unconfirmed (§A6).
- **Contact mailbox** — `info@travisiontours.com` stays unpublished until
  confirmed live (§A8).
- **Blog** — five articles are now published and indexable (§A4). Owner
  should read them for voice/accuracy before launch; they contain no prices,
  ratings, or claims beyond the catalog.
- **Policies** — legal items listed in §C (lawful basis, retention,
  deletion rights, governing law) need sign-off.
- **Cancellation terms** — only the global policy version exists; per-tour
  or final terms are deferred to the written quotation.
