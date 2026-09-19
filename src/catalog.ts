import type { Tour } from './types';
import { SAMPLE_TOURS } from './constants';
import { DAY_TOURS } from './dayTours';

/**
 * Central catalog collections.
 *
 * Membership is declared explicitly here, by tour ID. It is deliberately NOT
 * inferred from a tour's `category`, `title`, or `location`, because inference
 * produced incorrect results — most visibly, inland adventure tours such as the
 * White Desert appearing under Shore Excursions.
 *
 * When a tour is added or removed, update the relevant list below. The
 * `check:catalog` test in Phase 9 asserts that every published tour ID appears
 * in exactly one collection and that no listed ID is missing from the catalogs.
 */

export type CollectionId = 'all' | 'packages' | 'daytours' | 'cruises' | 'shore';

export const COLLECTION_IDS = ['all', 'packages', 'daytours', 'cruises', 'shore'] as const;

/** Multi-day packages. Single-day trips are excluded. */
const PACKAGE_TOUR_IDS = [
  '4-days-cairo-giza-pyramids-tour',
  'pkg-7-5-days-cairo--luxor---abu-simbel-tour',
  '6-days-cairo-luxor-aswan',
  '7-days-cairo-luxor-aswan-abu-simbel-edfu-kom-ombo',
  '8-days-budget-egypt-complete-tour',
  '9-days-cairo-alexandria-luxor-aswan-trip',
  '12-days-family-egypt-red-sea-holiday',
  '14-days-trip-to-the-best-of-egypt',
  '15-days-marvelous-egypt-tour-package'
] as const;

/** Single-day trips that are stored in the packages catalog file. */
export const DAY_TRIP_IDS = [
  'pyramids-tour-from-cairo-airport',
  'day-trip-to-giza-pyramids-from-cairo',
  'tour-to-giza-pyramids-old-cairo'
] as const;

/** Every tour in the day-tour catalog. */
const DAY_TOUR_IDS = [
  'cairo-day-tour',
  'giza-pyramids-day-tour',
  'luxor-day-tour',
  'aswan-day-tour',
  'abu-simbel-day-tour',
  'alexandria-day-tour',
  'old-cairo-day-tour',
  'hurghada-day-tour',
  'sharm-el-sheikh-day-tour',
  'marsa-alam-day-tour',
  'el-gouna-day-tour',
  'makadi-bay-day-tour',
  'soma-bay-day-tour',
  'port-ghalib-day-tour',
  'sakkara-day-tour',
  'dahshur-day-tour',
  'egyptian-museum-day-tour',
  'white-desert-day-tour',
  'philae-temple-day-tour',
  'valley-of-kings-day-tour',
  'karnak-temple-day-tour',
  'nile-cruise-day-tour'
] as const;

/**
 * Coastal and Red Sea excursions only.
 * Inland adventures — including `white-desert-day-tour` — are intentionally
 * absent, even though they carry the `adventure` category.
 */
const SHORE_EXCURSION_IDS = [
  'hurghada-day-tour',
  'sharm-el-sheikh-day-tour',
  'marsa-alam-day-tour',
  'el-gouna-day-tour',
  'makadi-bay-day-tour',
  'soma-bay-day-tour',
  'port-ghalib-day-tour'
] as const;

/** Packages whose itinerary includes a Nile cruise. */
const NILE_CRUISE_IDS = [
  '8-days-budget-egypt-complete-tour',
  '12-days-family-egypt-red-sea-holiday'
] as const;

const COLLECTION_MEMBERS: Record<Exclude<CollectionId, 'all'>, ReadonlySet<string>> = {
  packages: new Set<string>(PACKAGE_TOUR_IDS),
  daytours: new Set<string>(DAY_TOUR_IDS),
  cruises: new Set<string>(NILE_CRUISE_IDS),
  shore: new Set<string>(SHORE_EXCURSION_IDS)
};

/** Which catalog file each collection draws its candidates from. */
const COLLECTION_SOURCES: Record<CollectionId, Tour[]> = {
  all: SAMPLE_TOURS,
  packages: SAMPLE_TOURS,
  daytours: DAY_TOURS,
  cruises: SAMPLE_TOURS,
  shore: DAY_TOURS
};

/** The candidate list a collection filters over. */
export function getCollectionSource(collection: CollectionId): Tour[] {
  return COLLECTION_SOURCES[collection] ?? SAMPLE_TOURS;
}

/** Whether a tour belongs to a collection. `all` accepts everything. */
export function isInCollection(tourId: string, collection: CollectionId): boolean {
  if (collection === 'all') return true;
  return COLLECTION_MEMBERS[collection]?.has(tourId) ?? false;
}

/** Coerce an untrusted query-string value into a known collection. */
export function normalizeCollectionId(value: string | null | undefined): CollectionId {
  return (COLLECTION_IDS as readonly string[]).includes(value ?? '')
    ? (value as CollectionId)
    : 'all';
}

/** Every published tour ID, used by catalog and image-coverage checks. */
export function getAllCatalogTourIds(): string[] {
  return SAMPLE_TOURS.map(tour => tour.id).concat(DAY_TOURS.map(tour => tour.id));
}
