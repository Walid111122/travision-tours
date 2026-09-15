import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App.tsx';
import { PAGE_LOADERS, lazyPages, type PageComponents } from './AppShell';
import { pageKeyFor } from './routeTable';
import './index.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container #root is missing from the document.');
}

/**
 * Prerendered documents arrive with real markup already inside `#root`.
 * Hydrating reuses that markup — including its layout and images, so there is
 * no flash of empty content — and then attaches the event handlers. Documents
 * without prerendered content (the dev server) fall back to a fresh render.
 *
 * The route's own chunk is resolved *before* the first render. `React.lazy`
 * suspends on its first render even when the module is already cached, and a
 * boundary that suspends while hydrating makes React discard the prerendered
 * markup and render the page again on the client — which would throw away
 * everything the prerenderer produced. Resolving it up front keeps the first
 * render synchronous, so hydration reuses the server's DOM exactly. Navigating
 * to another route later still fetches that route's chunk on demand.
 */
async function start() {
  if (!container.hasChildNodes()) {
    createRoot(container).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    return;
  }

  const pageKey = pageKeyFor(window.location.pathname);
  const page = await PAGE_LOADERS[pageKey]();

  const pages: PageComponents = { ...lazyPages };
  pages[pageKey] = page.default;

  hydrateRoot(
    container,
    <StrictMode>
      <App pages={pages} />
    </StrictMode>
  );
}

void start().catch(error => {
  // The prerendered markup is already on screen and readable; only the event
  // handlers are missing. Leaving it in place beats letting React re-render
  // over it, so this is deliberately not rethrown.
  console.error('Could not hydrate the prerendered page; it stays visible but inert.', error);
});
