/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import AppShell, { type PageComponents } from './AppShell';

/**
 * Browser entry. The route table and layout live in `AppShell` so that the
 * prerenderer can render the identical tree with a `StaticRouter`.
 *
 * `pages` is supplied by `main.tsx`, which resolves the current route's chunk
 * before hydrating so the first render does not suspend. Without it,
 * `AppShell` falls back to loading every page lazily.
 */
export default function App({ pages }: { pages?: PageComponents }) {
  return (
    <HelmetProvider>
      <Router>
        <AppShell pages={pages} />
      </Router>
    </HelmetProvider>
  );
}
