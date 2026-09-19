/**
 * Prerender every route into its own complete HTML document.
 *
 *   tsx scripts/prerender.ts        (runs after the client and SSR builds)
 *
 * The client build's `dist/index.html` supplies two things and is then replaced:
 *   - the hashed asset URLs Vite emitted (stylesheet, module script)
 *   - the static head tags, which are compared against `src/Document.tsx` so the
 *     two definitions cannot drift apart unnoticed
 *
 * Each route is rendered through the SSR bundle, which renders a full document
 * so React can hoist the page's title and meta tags into `<head>`. Writing one
 * document per route is also what lets the Worker answer unknown paths with a
 * real 404 instead of the app shell and a 200.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as cheerio from 'cheerio';

import { prerenderRoutes } from '../src/routes';
import { resolveSiteUrl } from './site-url.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const distDir = path.join(root, 'dist');
const templatePath = path.join(distDir, 'index.html');
const ssrEntry = path.join(root, 'dist-ssr', 'entry-server.js');

/** Where a route's document is written, relative to `dist`. */
function outputFileFor(route: string): string {
  if (route === '/') return 'index.html';
  return path.join(route.replace(/^\//, ''), 'index.html');
}

const siteUrl = resolveSiteUrl();

if (!existsSync(ssrEntry)) {
  console.error(`Missing SSR bundle at ${path.relative(root, ssrEntry)}. Run the SSR build first.`);
  process.exit(1);
}

/* ------------------------------------------------------ read the client shell */

const shell = await readFile(templatePath, 'utf8');
const $shell = cheerio.load(shell);

const assets = {
  styles: $shell('link[rel="stylesheet"]')
    .map((_i, el) => $shell(el).attr('href'))
    .get()
    .filter((href): href is string => Boolean(href)),
  scripts: $shell('script[type="module"][src]')
    .map((_i, el) => $shell(el).attr('src'))
    .get()
    .filter((src): src is string => Boolean(src))
};

if (assets.scripts.length === 0) {
  console.error('No module script found in dist/index.html — did the client build run?');
  process.exit(1);
}

/**
 * A comparable signature for a tag: name plus attributes, order-independent and
 * ignoring the difference between `crossorigin` and `crossorigin=""`.
 */
function signature(element: { name: string; attribs?: Record<string, string> }): string {
  const attribs = element.attribs ?? {};
  const parts = Object.entries(attribs)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`);
  return `${element.name} ${parts.join(' ')}`.trim();
}

/**
 * Static head tags declared in `index.html`, ignoring Vite's hashed asset tags
 * (which are passed to `Document` separately). Compared as a subset against the
 * prerendered document so the two definitions cannot drift apart unnoticed.
 */
const declaredHeadTags = new Set(
  $shell('head > meta, head > link')
    .toArray()
    .filter(el => !($shell(el).attr('href') ?? '').includes('/assets/'))
    .map(signature)
);

/* --------------------------------------------------------------- render */

// Node's ESM loader rejects a bare Windows path ("C:\...") — it must be a
// file:// URL, otherwise ERR_UNSUPPORTED_ESM_URL_SCHEME.
const { render } = (await import(pathToFileURL(ssrEntry).href)) as {
  render: (
    url: string,
    assets: { styles: string[]; scripts: string[] }
  ) => Promise<{ document: string; notFound: boolean }>;
};

const routes = prerenderRoutes();
const failed: string[] = [];
const notFoundRoutes: string[] = [];
const documents = new Map<string, string>();

console.log(`Prerendering ${routes.length} routes for ${siteUrl} ...`);

for (const route of routes) {
  try {
    const { document, notFound } = await render(route, assets);

    if (notFound) {
      // A route listed in src/routes.ts that falls through to NotFound means
      // the route table and the route manifest have drifted apart.
      notFoundRoutes.push(route);
      continue;
    }

    documents.set(route, document);
  } catch (error) {
    failed.push(`${route} — ${(error as Error).message}`);
  }
}

/* --------------------------------------------------------- branded 404 page */

try {
  const { document } = await render('/this-route-does-not-exist', assets);
  documents.set('404', document);
} catch (error) {
  failed.push(`404.html — ${(error as Error).message}`);
}

/* -------------------------------------------------- drift check on head tags */

const homeDocument = documents.get('/');
if (homeDocument && declaredHeadTags.size > 0) {
  const $home = cheerio.load(homeDocument);
  const renderedHeadTags = new Set($home('head > meta, head > link').toArray().map(signature));

  const missing = [...declaredHeadTags].filter(tag => !renderedHeadTags.has(tag));
  if (missing.length > 0) {
    console.error(
      '\nsrc/Document.tsx and index.html have drifted apart. These tags are declared in\n' +
        'index.html but absent from the prerendered document:'
    );
    for (const tag of missing) console.error(`  - ${tag}`);
    console.error('Add them to the <head> in src/Document.tsx (or remove them from index.html).');
    failed.push('Document.tsx is out of sync with index.html');
  }
}

/* ------------------------------------------------------------------ write */

for (const [route, document] of documents) {
  const target = route === '404' ? path.join(distDir, '404.html') : path.join(distDir, outputFileFor(route));
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, document, 'utf8');
}

/* ------------------------------------------------------------------ report */

console.log(`  wrote ${documents.size} documents (${documents.size - 1} routes + 404.html)`);

if (notFoundRoutes.length > 0) {
  console.error(`\n${notFoundRoutes.length} route(s) in src/routes.ts rendered the NotFound page:`);
  for (const route of notFoundRoutes) console.error(`  - ${route}`);
  console.error('Add them to the route table in src/AppShell.tsx, or remove them from src/routes.ts.');
}

if (failed.length > 0) {
  console.error(`\n${failed.length} problem(s):`);
  for (const entry of failed) console.error(`  - ${entry}`);
  process.exit(1);
}
