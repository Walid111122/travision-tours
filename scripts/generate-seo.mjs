import { readFile, writeFile } from 'node:fs/promises';

const siteUrl = (process.env.SITE_URL || 'https://travisiontours.com').replace(/\/$/, '');
const constantsSource = await readFile(new URL('../src/constants.ts', import.meta.url), 'utf8');
const dayToursSource = await readFile(new URL('../src/dayTours.ts', import.meta.url), 'utf8');

const packageSection = constantsSource.split('export const SAMPLE_BLOG_POSTS')[0];
const dayTourSection = dayToursSource.split('export const POPULAR_DAY_TOURS')[0];
const packageIds = [...packageSection.matchAll(/^\s{4}"id":\s*"([^"]+)"/gm)].map(match => match[1]);
const dayTourIds = [...dayTourSection.matchAll(/^\s{4}id:\s*'([^']+)'/gm)].map(match => match[1]);

const publicRoutes = [
  '/',
  '/tours',
  '/tours?type=packages',
  '/tours?type=daytours',
  '/tours?type=cruises',
  '/tours?type=shore',
  '/blog',
  '/guidelines',
  '/policies',
  ...[...new Set([...packageIds, ...dayTourIds])].map(id => `/tours/${id}`)
];

const escapeXml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...publicRoutes.map(route => `  <url><loc>${escapeXml(`${siteUrl}${route}`)}</loc></url>`),
  '</urlset>',
  ''
].join('\n');

const robots = [
  'User-agent: *',
  'Allow: /',
  'Disallow: /profile',
  'Disallow: /planner',
  '',
  `Sitemap: ${siteUrl}/sitemap.xml`,
  ''
].join('\n');

await Promise.all([
  writeFile(new URL('../public/sitemap.xml', import.meta.url), sitemap),
  writeFile(new URL('../public/robots.txt', import.meta.url), robots)
]);

console.log(`Generated sitemap with ${publicRoutes.length} indexable URLs.`);
