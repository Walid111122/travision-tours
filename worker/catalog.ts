import { SAMPLE_TOURS } from '../src/constants';
import { DAY_TOURS } from '../src/dayTours';

/**
 * Canonical, server-side tour catalog.
 *
 * The client is never trusted for a tour's title, price, payment recipient or
 * policy version. It submits a stable tour ID only, and everything else is
 * resolved from the same catalog the storefront renders — so the two can never
 * drift apart.
 */
export type CatalogTour = {
  id: string;
  title: string;
};

const CATALOG = new Map<string, CatalogTour>();

// Mirrors the storefront's `[...SAMPLE_TOURS, ...DAY_TOURS]` lookup order:
// the first entry with a given ID wins.
for (const tour of [...SAMPLE_TOURS, ...DAY_TOURS]) {
  if (!CATALOG.has(tour.id)) {
    CATALOG.set(tour.id, { id: tour.id, title: tour.title });
  }
}

export function findCatalogTour(tourId: string): CatalogTour | undefined {
  return CATALOG.get(tourId);
}

export function isKnownTourId(tourId: string): boolean {
  return CATALOG.has(tourId);
}
