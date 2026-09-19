import { describe, expect, it } from 'vitest';
import {
  COLLECTION_IDS,
  DAY_TRIP_IDS,
  getAllCatalogTourIds,
  getCollectionSource,
  isInCollection,
  normalizeCollectionId,
  type CollectionId
} from '../../src/catalog';
import { SAMPLE_TOURS } from '../../src/constants';
import { DAY_TOURS } from '../../src/dayTours';

/**
 * Catalog and filter-classification checks.
 *
 * `src/catalog.ts` documents that collection membership is declared explicitly
 * rather than inferred from category, title or location, because inference
 * produced wrong results — most visibly inland adventures such as the White
 * Desert appearing under Shore Excursions. These tests hold that line.
 *
 * Everything is asserted through the public API rather than the private ID sets,
 * so a refactor of the internal structures cannot silently change behaviour.
 */

const TYPE_COLLECTIONS: CollectionId[] = ['packages', 'daytours'];

/** The tours a collection actually shows: source list, then membership filter. */
function visibleIn(collection: CollectionId): string[] {
  return getCollectionSource(collection)
    .filter(tour => isInCollection(tour.id, collection))
    .map(tour => tour.id);
}

describe('normalizeCollectionId', () => {
  it.each(COLLECTION_IDS)('accepts the known collection %s', id => {
    expect(normalizeCollectionId(id)).toBe(id);
  });

  it.each([
    [null, 'null'],
    [undefined, 'undefined'],
    ['', 'empty string'],
    ['PACKAGES', 'wrong case'],
    ['nile-cruise', 'a plausible but unknown slug'],
    ['packages;drop table', 'injection-shaped input']
  ])('falls back to "all" for %s (%s)', value => {
    expect(normalizeCollectionId(value)).toBe('all');
  });
});

describe('isInCollection', () => {
  it('accepts every tour under "all"', () => {
    for (const id of getAllCatalogTourIds()) {
      expect(isInCollection(id, 'all'), `${id} should be in "all"`).toBe(true);
    }
  });

  it('rejects an unknown tour ID from a specific collection', () => {
    expect(isInCollection('not-a-real-tour', 'packages')).toBe(false);
    expect(isInCollection('not-a-real-tour', 'daytours')).toBe(false);
  });
});

describe('getCollectionSource', () => {
  it('draws packages and cruises from the packages catalog', () => {
    expect(getCollectionSource('packages')).toBe(SAMPLE_TOURS);
    expect(getCollectionSource('cruises')).toBe(SAMPLE_TOURS);
  });

  it('draws day tours and shore excursions from the day-tour catalog', () => {
    expect(getCollectionSource('daytours')).toBe(DAY_TOURS);
    expect(getCollectionSource('shore')).toBe(DAY_TOURS);
  });
});

describe('collection membership', () => {
  it('keeps packages and day tours mutually exclusive', () => {
    const overlap = visibleIn('packages').filter(id => visibleIn('daytours').includes(id));
    expect(overlap).toEqual([]);
  });

  it('contains every cruise within the packages collection', () => {
    // Cruises is a cross-cutting tag, not a partition: a tour can be both a
    // package and a Nile cruise.
    for (const id of visibleIn('cruises')) {
      expect(isInCollection(id, 'packages'), `${id} should also be a package`).toBe(true);
    }
  });

  it('contains every shore excursion within the day-tour collection', () => {
    for (const id of visibleIn('shore')) {
      expect(isInCollection(id, 'daytours'), `${id} should also be a day tour`).toBe(true);
    }
  });

  it('excludes the White Desert from shore excursions', () => {
    // The documented regression: the White Desert carries the `adventure`
    // category but is an inland tour, so it must never appear under a coastal
    // filter. Category-based inference got this wrong.
    expect(isInCollection('white-desert-day-tour', 'shore')).toBe(false);
  });

  it('excludes every Red Sea resort from the packages collection', () => {
    for (const id of visibleIn('shore')) {
      expect(isInCollection(id, 'packages')).toBe(false);
    }
  });
});

describe('every published tour is reachable', () => {
  it('documents the current source lists', () => {
    // Pinned so that any change to what a collection draws from is visible here
    // rather than only in the browser. Update deliberately, not by accident.
    expect(visibleIn('all')).toHaveLength(12);
    expect(visibleIn('packages')).toHaveLength(9);
    expect(visibleIn('daytours')).toHaveLength(22);
    expect(visibleIn('cruises')).toHaveLength(2);
    expect(visibleIn('shore')).toHaveLength(7);
  });

  it.fails('lists every tour in the "all" collection', () => {
    // KNOWN GAP.
    //
    // `isInCollection(id, 'all')` returns true for *every* tour, so the filter
    // predicate declares that "all" means everything. But `COLLECTION_SOURCES.all`
    // is `SAMPLE_TOURS`, which holds only the 12 package-catalog entries, so the
    // predicate is never consulted for the 22 day tours: they are not in the
    // source list at all.
    //
    // The practical effect is that `/tours` — the page the navbar's "Search
    // tours" icon opens — can only ever find 12 of the 34 published tours. A
    // visitor searching "Hurghada" or "Abu Simbel" gets no results, because both
    // are day tours.
    //
    // Not corrected here: changing the source changes what that page shows and
    // how it is indexed, which is an owner decision. See the Phase 9 report.
    const published = getAllCatalogTourIds();
    const all = visibleIn('all');
    expect(new Set(all)).toEqual(new Set(published));
  });

  it.fails('exposes every published tour ID through the union of the type collections', () => {
    // KNOWN GAP, related to the one above.
    //
    // Three single-day tours live in `SAMPLE_TOURS` rather than `dayTours.ts`:
    //   pyramids-tour-from-cairo-airport, day-trip-to-giza-pyramids-from-cairo,
    //   tour-to-giza-pyramids-old-cairo
    // They are listed in the exported-but-unused `DAY_TRIP_IDS`. They are not
    // members of `packages` (correct — they are not multi-day) and not members
    // of `daytours` either, because that set is built only from `DAY_TOURS`.
    // Filtering by "Day Tours" therefore cannot find them.
    const published = getAllCatalogTourIds();
    const covered = new Set(TYPE_COLLECTIONS.flatMap(visibleIn));
    const uncovered = published.filter(id => !covered.has(id));
    expect(uncovered).toEqual([]);
  });

  it('keeps DAY_TRIP_IDS consistent with the published catalog', () => {
    // Even while unwired, the list must not rot: every ID in it has to be real.
    const published = new Set(getAllCatalogTourIds());
    for (const id of DAY_TRIP_IDS) {
      expect(published.has(id), `${id} is listed in DAY_TRIP_IDS but not published`).toBe(true);
    }
  });
});
