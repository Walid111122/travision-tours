/**
 * Generate `public/sitemap.xml` and `public/robots.txt`.
 *
 *   tsx scripts/generate-seo.ts      (wired into `prebuild`)
 *
 * Both files are derived from `src/routes.ts`, which is the same source the
 * prerenderer and the app's router use. The previous version parsed the catalog
 * TypeScript with regular expressions, so a new tour could appear in the app
 * without ever reaching the sitemap.
 */

import { writeFile } from 'node:fs/promises';
import { DISALLOWED_PATHS, sitemapRoutes } from '../src/routes';
import { resolveSiteUrl } from './site-url.mjs';

const siteUrl = resolveSiteUrl();
const routes = sitemapRoutes();

const escapeXml = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...routes.map(route => `  <url><loc>${escapeXml(`${siteUrl}${route}`)}</loc></url>`),
  '</urlset>',
  ''
].join('\n');

const robots = [
  'User-agent: *',
  'Allow: /',
  ...DISALLOWED_PATHS.map(path => `Disallow: ${path}`),
  '',
  `Sitemap: ${siteUrl}/sitemap.xml`,
  ''
].join('\n');

await Promise.all([
  writeFile(new URL('../public/sitemap.xml', import.meta.url), sitemap),
  writeFile(new URL('../public/robots.txt', import.meta.url), robots)
]);

const duplicates = routes.filter((route, index) => routes.indexOf(route) !== index);
if (duplicates.length > 0) {
  throw new Error(`Sitemap contains duplicate routes: ${duplicates.join(', ')}`);
}

console.log(`Sitemap: ${routes.length} canonical URLs from ${siteUrl}`);
console.log(`Robots:  ${DISALLOWED_PATHS.length} disallowed paths`);
