/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ContactActions from './components/ContactActions';
import { ROUTE_TABLE, type PageKey } from './routeTable';

/**
 * The page components, keyed by route. Passed in rather than imported directly
 * so the browser can code-split while the prerenderer can supply the same
 * components eagerly.
 */
export type PageComponents = Record<PageKey, React.ComponentType>;

/**
 * One dynamic import per page, so the browser fetches only the route it needs.
 *
 * `entry-server.tsx` imports the same components statically instead. That
 * difference is deliberate: during prerendering nothing may suspend, because a
 * suspended boundary makes React's streaming renderer hide the page inside a
 * `hidden` div that only an inline script can reveal.
 */
export const PAGE_LOADERS: Record<PageKey, () => Promise<{ default: React.ComponentType }>> = {
  Home: () => import('./pages/Home'),
  Tours: () => import('./pages/Tours'),
  TourDetails: () => import('./pages/TourDetails'),
  Blog: () => import('./pages/Blog'),
  ItineraryBuilder: () => import('./pages/ItineraryBuilder'),
  Guidelines: () => import('./pages/Guidelines'),
  Policies: () => import('./pages/Policies'),
  About: () => import('./pages/About'),
  Contact: () => import('./pages/Contact'),
  Admin: () => import('./pages/Admin'),
  NotFound: () => import('./pages/NotFound')
};

/** Browser defaults: one chunk per route, fetched on navigation. */
export const lazyPages = Object.fromEntries(
  Object.entries(PAGE_LOADERS).map(([key, load]) => [key, lazy(load)])
) as PageComponents;

/**
 * The layout and route table, with no router of its own.
 *
 * `App` supplies a `BrowserRouter` in the browser and `entry-server` supplies a
 * `StaticRouter` during prerendering, so both environments render exactly the
 * same tree — which is what makes hydration reuse the prerendered markup
 * instead of discarding it.
 *
 * The prerenderer passes eagerly imported pages. That matters: a `React.lazy`
 * component suspends on first render even when its module is already loaded, and
 * a suspended boundary makes React's streaming renderer put the page inside a
 * `hidden` div that only an inline script can reveal. That content is invisible
 * to a crawler and the script is blocked by our own Content Security Policy.
 */
export default function AppShell({ pages = lazyPages }: { pages?: PageComponents }) {
  return (
    /* `reducedMotion="user"` makes every `motion` animation in the tree honour
       the visitor's OS-level reduce-motion setting. The CSS media query in
       index.css cannot reach JS-driven animation, so both are needed. */
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col bg-egypt-night">
        {/* Lets a keyboard visitor jump past the navigation straight to the
            page content. Visually hidden until it receives focus. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:bg-egypt-gold focus:text-egypt-night focus:px-6 focus:py-3 focus:rounded-xl focus:font-black focus:uppercase focus:tracking-widest focus:text-xs"
        >
          Skip to main content
        </a>
        <Navbar />
        <main id="main-content" tabIndex={-1} className="flex-grow">
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-egypt-gold">Loading journey…</div>}>
            <Routes>
              {ROUTE_TABLE.map(({ path, page }) => {
                const Page = pages[page];
                // The key goes on the fragment: `Route` is a plain function
                // component whose props are a union, which the installed types
                // reject a `key` on. `Routes` documents `React.Fragment` as a
                // supported child.
                return (
                  <React.Fragment key={path}>
                    <Route path={path} element={<Page />} />
                  </React.Fragment>
                );
              })}
              <Route path="*" element={<pages.NotFound />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
        <ContactActions />
      </div>
    </MotionConfig>
  );
}
