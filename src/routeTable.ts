/**
 * The route table, held as data rather than as JSX.
 *
 * Kept out of `routes.ts` — which lists routes for the sitemap and the
 * prerenderer, but reaches into the tour catalog — so the browser entry can ask
 * which page a URL needs without pulling the whole catalog into the entry
 * chunk. Kept out of `AppShell` so build-time checks can import it without
 * evaluating any components.
 *
 * `pageKeyFor` matches with React Router itself, so the table here and the
 * `<Routes>` in `AppShell` cannot disagree about which page a URL renders.
 */

import { matchPath } from 'react-router-dom';

export type PageKey =
  | 'Home'
  | 'Tours'
  | 'TourDetails'
  | 'Blog'
  | 'BlogPost'
  | 'ItineraryBuilder'
  | 'Guidelines'
  | 'Policies'
  | 'About'
  | 'Contact'
  | 'Admin'
  | 'NotFound';

export const ROUTE_TABLE: { path: string; page: PageKey }[] = [
  { path: '/', page: 'Home' },
  { path: '/tours', page: 'Tours' },
  { path: '/tours/:id', page: 'TourDetails' },
  { path: '/blog', page: 'Blog' },
  { path: '/blog/:id', page: 'BlogPost' },
  { path: '/planner', page: 'ItineraryBuilder' },
  { path: '/guidelines', page: 'Guidelines' },
  { path: '/policies', page: 'Policies' },
  { path: '/about', page: 'About' },
  { path: '/contact', page: 'Contact' },
  // Operator-only. The API behind it requires a Cloudflare Access identity.
  { path: '/admin', page: 'Admin' }
];

/**
 * Which page component a URL renders.
 *
 * `main.tsx` uses this to resolve the route's chunk before hydrating: a page
 * left to load lazily would suspend on the first render, and a boundary that
 * suspends while hydrating makes React discard the prerendered markup. Anything
 * unmatched falls through to the catch-all `NotFound` route, exactly as
 * `<Routes>` does.
 */
export function pageKeyFor(pathname: string): PageKey {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const match = ROUTE_TABLE.find(route => matchPath({ path: route.path, end: true }, path));
  return match ? match.page : 'NotFound';
}
