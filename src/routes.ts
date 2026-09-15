import { getAllCatalogTourIds } from './catalog';

/**
 * The single source of truth for every route the build must know about.
 *
 * The prerenderer, the sitemap generator and the robots generator all read
 * from here, so a route can never be added to the app without also being
 * prerendered and listed (or deliberately excluded). Previously the sitemap
 * parsed the catalog source with regular expressions, which meant the two
 * could drift apart silently.
 */

/**
 * Indexable pages. Prerendered, listed in the sitemap, and crawlable.
 *
 * `/tours` is the only listing URL that is canonical. The `?type=` views are
 * client-side filters over the same catalog: static hosting cannot serve a
 * distinct document per query string, so a sitemap entry for `?type=` would
 * point at HTML whose canonical disagrees with it. One canonical listing page
 * is correct; the filters stay fully usable in the browser.
 */
export const INDEXABLE_STATIC_ROUTES = [
  '/',
  '/tours',
  '/guidelines',
  '/policies',
  '/about',
  '/contact'
] as const;

/**
 * Real routes that must resolve and hydrate normally, but must never appear in
 * search results: the hidden blog, the client-side planner, and the
 * operator-only lead review.
 *
 * They are prerendered anyway so that a direct visit — or a bookmark — still
 * returns a real document instead of a 404.
 */
export const NOINDEX_STATIC_ROUTES = ['/blog', '/planner', '/admin'] as const;

/** Every published tour, one prerendered document each. */
export function tourRoutes(): string[] {
  return [...new Set(getAllCatalogTourIds())].map(id => `/tours/${id}`);
}

/** Every route the prerenderer must emit a document for. */
export function prerenderRoutes(): string[] {
  return [...INDEXABLE_STATIC_ROUTES, ...NOINDEX_STATIC_ROUTES, ...tourRoutes()];
}

/** Sitemap entries: canonical and indexable only. */
export function sitemapRoutes(): string[] {
  return [...INDEXABLE_STATIC_ROUTES, ...tourRoutes()];
}

/**
 * Paths that are disallowed in robots.txt because they are either noindex or
 * operator-only. Kept here so robots.txt cannot drift from the route list.
 */
export const DISALLOWED_PATHS = [...NOINDEX_STATIC_ROUTES];
