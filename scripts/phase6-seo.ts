/**
 * Phase 6 checks — prerendering, metadata and HTTP status handling.
 *
 *   npm run test:seo
 *
 * Inspects the built output in `dist/`. Run after `npm run build`.
 *
 * These assertions exist because the failure modes here are invisible in a
 * browser: metadata stranded in `<body>`, a sitemap listing URLs that redirect,
 * or a canonical pointing at a domain the owner does not control all look fine
 * on screen and are only wrong to a crawler.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

import { DISALLOWED_PATHS, NOINDEX_STATIC_ROUTES, prerenderRoutes, sitemapRoutes } from '../src/routes';
import { pageKeyFor } from '../src/routeTable';

const root = fileURLToPath(new URL('..', import.meta.url));
const distDir = path.join(root, 'dist');

let passed = 0;
const failures: string[] = [];

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed += 1;
  } else {
    failures.push(detail ? `${name} — ${detail}` : name);
  }
}

function section(title: string) {
  console.log(`\n=== ${title} ===`);
}

function documentPathFor(route: string) {
  return route === '/' ? path.join(distDir, 'index.html') : path.join(distDir, route.replace(/^\//, ''), 'index.html');
}

function load(route: string) {
  const file = documentPathFor(route);
  if (!existsSync(file)) return null;
  return cheerio.load(readFileSync(file, 'utf8'));
}

if (!existsSync(distDir)) {
  console.error('dist/ is missing. Run `npm run build` first.');
  process.exit(1);
}

/* ------------------------------------------------- every route has a document */

section('Route coverage');

const missingDocuments = prerenderRoutes().filter(route => !existsSync(documentPathFor(route)));
check('every route in the manifest has a prerendered document', missingDocuments.length === 0, missingDocuments.slice(0, 5).join(', '));
check('a branded 404 document exists', existsSync(path.join(distDir, '404.html')));
check('the sitemap was generated', existsSync(path.join(distDir, 'sitemap.xml')));
check('robots.txt was generated', existsSync(path.join(distDir, 'robots.txt')));

const htmlCount = readdirSync(distDir, { recursive: true }).filter(entry => String(entry).endsWith('.html')).length;
check('no unexpected extra documents', htmlCount === prerenderRoutes().length + 1, `${htmlCount} html files`);

/* ------------------------------------------------- client can resolve each route */

section('Client route resolution');

/**
 * `main.tsx` resolves the current route's chunk *before* hydrating, because a
 * page left to load lazily would suspend on the first render — and a boundary
 * that suspends while hydrating makes React throw the prerendered markup away.
 * So every prerendered route has to map to a real page component. A route that
 * fell through to the catch-all would hydrate from a lazy chunk and lose the
 * server's HTML on the very first paint.
 */
const unresolvedRoutes = prerenderRoutes().filter(route => pageKeyFor(route) === 'NotFound');
check(
  'every prerendered route resolves to a real page component',
  unresolvedRoutes.length === 0,
  unresolvedRoutes.slice(0, 5).join(', ')
);

check(
  'an unknown URL resolves to the catch-all 404 page',
  pageKeyFor('/definitely-not-a-real-route') === 'NotFound'
);

/* ------------------------------------------------------------- head metadata */

section('Metadata lives in <head>');
const indexable = sitemapRoutes();

const titlesInBody: string[] = [];
const missingTitles: string[] = [];
const missingDescriptions: string[] = [];
const missingCanonicals: string[] = [];
const wrongRobots: string[] = [];
const missingSocial: string[] = [];
const missingH1: string[] = [];
const trailingSlashCanonicals: string[] = [];
const localhostLeaks: string[] = [];
const badStructuredData: string[] = [];
const forbiddenSchema: string[] = [];

/** Schema types that would overstate what the site actually offers. */
const FORBIDDEN_SCHEMA_TYPES = ['Offer', 'AggregateRating', 'Review', 'Product', 'IndividualProduct'];

for (const route of prerenderRoutes()) {
  const $ = load(route);
  if (!$) continue;

  const file = path.relative(distDir, documentPathFor(route));
  const isIndexable = indexable.includes(route);

  if ($('body title').length > 0 || $('#root title').length > 0) titlesInBody.push(file);

  const headTitle = $('head title').first().text().trim();
  if (!headTitle) missingTitles.push(file);

  const description = $('head meta[name=description]').attr('content');
  if (!description) missingDescriptions.push(file);

  const canonical = $('head link[rel=canonical]').attr('href');
  if (isIndexable && !canonical) missingCanonicals.push(file);
  // Only the root canonical may end in a slash; the Worker is configured to
  // drop trailing slashes, so anything else would point at a redirect.
  if (canonical && canonical.endsWith('/') && !/^https?:\/\/[^/]+\/$/.test(canonical)) {
    trailingSlashCanonicals.push(file);
  }

  const robots = $('head meta[name=robots]').attr('content') ?? '';
  if (isIndexable && !robots.startsWith('index')) wrongRobots.push(`${file} (${robots || 'missing'})`);
  if (!isIndexable && !robots.startsWith('noindex')) wrongRobots.push(`${file} (${robots || 'missing'})`);

  if (
    !$('head meta[property="og:title"]').attr('content') ||
    !$('head meta[property="og:image"]').attr('content') ||
    !$('head meta[name="twitter:card"]').attr('content')
  ) {
    missingSocial.push(file);
  }

  if ($('#root h1').length === 0) missingH1.push(file);

  const raw = readFileSync(documentPathFor(route), 'utf8');
  if (raw.includes('localhost') || raw.includes('127.0.0.1')) localhostLeaks.push(file);

  $('script[type="application/ld+json"]').each((_i, el) => {
    const text = $(el).text();
    try {
      const parsed = JSON.parse(text);
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of nodes) {
        const type = node?.['@type'];
        if (typeof type === 'string' && FORBIDDEN_SCHEMA_TYPES.includes(type)) {
          forbiddenSchema.push(`${file}: ${type}`);
        }
      }
    } catch {
      badStructuredData.push(file);
    }
  });
}

check('no <title> is stranded in the body', titlesInBody.length === 0, titlesInBody.slice(0, 5).join(', '));
check('every route has a <title> in <head>', missingTitles.length === 0, missingTitles.slice(0, 5).join(', '));
check('every route has a meta description in <head>', missingDescriptions.length === 0, missingDescriptions.slice(0, 5).join(', '));
check('every indexable route declares a canonical', missingCanonicals.length === 0, missingCanonicals.slice(0, 5).join(', '));
check('canonical URLs have no trailing slash (except the root)', trailingSlashCanonicals.length === 0, trailingSlashCanonicals.slice(0, 5).join(', '));
check('robots meta matches whether the route is indexable', wrongRobots.length === 0, wrongRobots.slice(0, 5).join(', '));
check('Open Graph and Twitter tags are present', missingSocial.length === 0, missingSocial.slice(0, 5).join(', '));
check('every document has crawlable content (an <h1>)', missingH1.length === 0, missingH1.slice(0, 5).join(', '));
check('no document references localhost', localhostLeaks.length === 0, localhostLeaks.slice(0, 5).join(', '));

/* ----------------------------------------------------------- structured data */

section('Structured data');

check('all JSON-LD blocks parse', badStructuredData.length === 0, badStructuredData.slice(0, 5).join(', '));
check(
  'no Offer, Review, Rating or Product markup is invented',
  forbiddenSchema.length === 0,
  forbiddenSchema.slice(0, 5).join(', ')
);

const homeStructured = load('/')?.('script[type="application/ld+json"]').first().text();
if (homeStructured) {
  const org = JSON.parse(homeStructured);
  check('the organisation node names the business', org.name === 'Travision Tours');
  check('the organisation node carries a real url', typeof org.url === 'string' && org.url.startsWith('http'));
}

const tourStructured = load('/tours/cairo-day-tour')?.('script[type="application/ld+json"]').first().text();
if (tourStructured) {
  const nodes = JSON.parse(tourStructured);
  const types = (Array.isArray(nodes) ? nodes : [nodes]).map(node => node['@type']);
  check('a tour page declares a TouristTrip', types.includes('TouristTrip'));
  check('a tour page declares a breadcrumb trail', types.includes('BreadcrumbList'));
  check('a tour page declares an FAQ', types.includes('FAQPage'));
  check('a TouristTrip does not claim a fixed price', !JSON.stringify(nodes).includes('"offers"'));
}

/* ------------------------------------------------------------------ 404 page */

section('404 document');

const notFoundFile = path.join(distDir, '404.html');
if (existsSync(notFoundFile)) {
  const $404 = cheerio.load(readFileSync(notFoundFile, 'utf8'));
  check('the 404 page has its own title', $404('head title').text().includes('Page Not Found'));
  check('the 404 page is noindex', ($404('head meta[name=robots]').attr('content') ?? '').startsWith('noindex'));
  check('the 404 page does not claim a canonical URL', $404('head link[rel=canonical]').length === 0);
  check('the 404 page renders branded content', $404('#root h1').length > 0);
}

/* ------------------------------------------------------------------- sitemap */

section('Sitemap');

const sitemap = readFileSync(path.join(distDir, 'sitemap.xml'), 'utf8');
const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);

check('the sitemap is well formed', sitemap.startsWith('<?xml') && sitemap.includes('</urlset>'));
check('the sitemap has no duplicate URLs', new Set(locations).size === locations.length);
check('the sitemap has no query parameters', !locations.some(url => url.includes('?')));
check('the sitemap has no fragment identifiers', !locations.some(url => url.includes('#')));
check(
  'the sitemap lists exactly the indexable routes',
  locations.length === indexable.length,
  `${locations.length} vs ${indexable.length}`
);
check(
  'the sitemap excludes noindex routes',
  !NOINDEX_STATIC_ROUTES.some(route => locations.some(url => url.endsWith(route)))
);

const sitemapOrigin = locations[0]?.match(/^(https?:\/\/[^/]+)/)?.[1];
check('every sitemap URL shares one origin', locations.every(url => url.startsWith(sitemapOrigin ?? '###')));
check('the sitemap origin is not localhost', !/localhost|127\.0\.0\.1/.test(sitemapOrigin ?? ''));

/* -------------------------------------------------------------------- robots */

section('robots.txt');

const robots = readFileSync(path.join(distDir, 'robots.txt'), 'utf8');
check('robots.txt allows crawling', robots.includes('User-agent: *') && robots.includes('Allow: /'));
check(
  'robots.txt disallows exactly the non-public routes',
  DISALLOWED_PATHS.every(p => robots.includes(`Disallow: ${p}`))
);
check('robots.txt points at the sitemap', robots.includes(`Sitemap: ${sitemapOrigin}/sitemap.xml`));

/* -------------------------------------------------------------- no leftovers */

section('Build hygiene');

const leftovers = ['app-head', 'app-html'].filter(marker =>
  readdirSync(distDir, { recursive: true }).some(entry => {
    const name = String(entry);
    if (!name.endsWith('.html')) return false;
    return readFileSync(path.join(distDir, name), 'utf8').includes(`<!--${marker}-->`);
  })
);
check('no prerender placeholders remain in the output', leftovers.length === 0, leftovers.join(', '));

/**
 * React's streaming renderer "outlines" a Suspense boundary once its content
 * passes roughly 12.8 kB: the page ends up inside a `hidden` div that only an
 * inline `$RC` script can reveal. That hides every page behind JavaScript and
 * demands a CSP exception for the script, so `entry-server` raises
 * `progressiveChunkSize` to Infinity to keep the markup inline. Nothing in the
 * output may reintroduce the outlined form.
 *
 * Only React's own markers are matched here. A bare `<div hidden>` is a real
 * element in this app — the inquiry form's honeypot — and must not trip it.
 */
const BOUNDARY_MARKERS = ['<!--$?-->', '<template id="B:', '$RC(', '<div hidden id="S:'];
const outlinedDocuments = readdirSync(distDir, { recursive: true })
  .map(String)
  .filter(name => name.endsWith('.html'))
  .filter(name => {
    const html = readFileSync(path.join(distDir, name), 'utf8');
    return BOUNDARY_MARKERS.some(marker => html.includes(marker));
  });
check(
  'no document hides its page behind a streaming boundary',
  outlinedDocuments.length === 0,
  outlinedDocuments.slice(0, 5).join(', ')
);

/* -------------------------------------------------------------------- result */

console.log('');
for (const failure of failures) console.error(`  FAIL  ${failure}`);

if (failures.length === 0) {
  console.log(`=== Result: ${passed} passed, 0 failed ===`);
  process.exit(0);
}

console.error(`=== Result: ${passed} passed, ${failures.length} failed ===`);
process.exit(1);
