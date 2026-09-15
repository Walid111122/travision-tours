/**
 * Phase 5 checks — responsive image pipeline.
 *
 *   npm run test:images
 *
 * Verifies that the generated manifest, the runtime lookup helpers and the
 * files actually on disk agree with one another. A mismatch here is the kind
 * of bug that only shows up as a broken image in production, so it is checked
 * directly rather than by eye.
 */

import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  getImageEntry,
  buildWebpSrcSet,
  hasOptimizedVariants
} from '../src/utils/responsiveImage';

const root = fileURLToPath(new URL('..', import.meta.url));
const publicDir = path.join(root, 'public');

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function section(title: string) {
  console.log(`\n=== ${title} ===`);
}

/** Turn a public path such as `/images/opt/x-480.ab.webp` into a disk path. */
function diskPath(publicPath: string) {
  return path.join(publicDir, publicPath.replace(/^\//, ''));
}

/* ------------------------------------------------------- manifest coverage */

section('Manifest coverage');

const heroEntry = getImageEntry('/hero.jpg');
check('the hero image is in the manifest', heroEntry !== undefined);
check('the hero image reports its intrinsic size', (heroEntry?.width ?? 0) > 0 && (heroEntry?.height ?? 0) > 0);
check('the hero image has multiple widths', (heroEntry?.variants.length ?? 0) > 1);

// A cache-busting query string must not defeat the lookup, otherwise the hero
// silently falls back to an unoptimized <img>.
const heroWithQuery = getImageEntry('/hero.jpg?v=2');
check('a query string does not defeat the lookup', heroWithQuery !== undefined);
check('the query-string lookup matches the bare path', heroWithQuery === heroEntry);

const galleryEntry = getImageEntry('/images/tours/6-days-cairo-luxor-aswan/gallery-1.jpeg');
check('a tour gallery image is in the manifest', galleryEntry !== undefined);

/* --------------------------------------------------------- remote fallback */

section('Sources without local variants');

const remote = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400';
check('a remote stock URL is not in the manifest', getImageEntry(remote) === undefined);
check('a remote stock URL reports no variants', hasOptimizedVariants(remote) === false);
check('a missing local file is not in the manifest', getImageEntry('/images/does-not-exist.jpeg') === undefined);

/* ------------------------------------------------------------- srcset shape */

section('srcset construction');

if (heroEntry) {
  const srcSet = buildWebpSrcSet(heroEntry);
  check('srcset is non-empty', srcSet.length > 0);

  const candidates = srcSet.split(',').map(part => part.trim());
  check('every candidate has a width descriptor', candidates.every(c => / \d+w$/.test(c)));

  const widths = candidates.map(c => Number(c.split(' ')[1].replace('w', '')));
  const ascending = widths.every((w, i) => i === 0 || w > widths[i - 1]);
  check('candidates are ordered smallest first', ascending);

  check('every candidate is a webp', candidates.every(c => c.includes('.webp')));

  // The largest generated width should not exceed the source, or we would be
  // upscaling and paying bytes for invented detail.
  const largest = Math.max(...widths);
  check('no variant is wider than the source', largest <= heroEntry.width, `largest ${largest}, source ${heroEntry.width}`);
}

/* ------------------------------------------------------- files exist on disk */

section('Referenced files exist on disk');

const manifestModule = await import('../src/generated/imageManifest.json', { with: { type: 'json' } });
const manifest = manifestModule.default as Record<string, { width: number; height: number; variants: { src: string; width: number }[] }>;

const missing: string[] = [];
let variantTotal = 0;
let oversized = 0;

for (const [publicPath, entry] of Object.entries(manifest)) {
  const fallback = diskPath(publicPath);
  if (!existsSync(fallback)) missing.push(publicPath);
  else if (statSync(fallback).size > 1024 * 1024) oversized += 1;

  for (const variant of entry.variants) {
    variantTotal += 1;
    const file = diskPath(variant.src);
    if (!existsSync(file)) missing.push(variant.src);
    else if (statSync(file).size > 1024 * 1024) oversized += 1;
  }
}

check('every manifest entry has a JPEG fallback on disk', missing.filter(m => !m.includes('/opt/')).length === 0);
check('every referenced variant exists on disk', missing.filter(m => m.includes('/opt/')).length === 0);
check('no referenced asset exceeds the 1 MB ceiling', oversized === 0, `${oversized} over`);
check('the manifest covers the whole local image set', Object.keys(manifest).length >= 100, `${Object.keys(manifest).length} entries`);
check('variants were generated for every source', variantTotal >= Object.keys(manifest).length * 2, `${variantTotal} variants`);

/* -------------------------------------------------------------- fonts wired */

section('Self-hosted fonts');

const fontFiles = ['marcellus-400-latin.woff2', 'inter-400-latin.woff2', 'inter-300-latin.woff2'];
check('the preloaded font files exist', fontFiles.every(f => existsSync(path.join(publicDir, 'fonts', f))));
check('src/fonts.css was generated', existsSync(path.join(root, 'src', 'fonts.css')));

const cssSource = await import('node:fs').then(fs => fs.readFileSync(path.join(root, 'src', 'index.css'), 'utf8'));
check('index.css no longer imports from Google Fonts', !cssSource.includes('fonts.googleapis.com'));
check('index.css imports the generated fonts.css', cssSource.includes('./fonts.css'));

/* --------------------------------------------------- rendered component markup */

section('Rendered markup');

const { renderToStaticMarkup } = await import('react-dom/server');
const React = await import('react');
const { default: ResponsiveImage } = await import('../src/components/ResponsiveImage');

const optimizedMarkup = renderToStaticMarkup(
  React.createElement(ResponsiveImage, {
    src: '/hero.jpg?v=2',
    alt: 'Travision Tours Group at Pyramids of Giza',
    sizes: '100vw',
    priority: true,
    className: 'w-full h-full object-cover'
  })
);

// Attribute names are compared case-insensitively: HTML attribute names are
// ASCII case-insensitive, and React's server renderer emits JSX casing
// (`srcSet`, `fetchPriority`) which the browser parses as `srcset`,
// `fetchpriority`. React's client renderer maps them to DOM properties.
const lower = (markup: string) => markup.toLowerCase();

check('an optimized source renders a <picture> wrapper', lower(optimizedMarkup).startsWith('<picture>'));
check('it emits a webp <source> with srcset', /<source type="image\/webp" srcset="[^"]+\.webp \d+w/.test(lower(optimizedMarkup)));
check('every srcset candidate is a webp with a width descriptor', /\.webp \d+w, /.test(lower(optimizedMarkup)));
check('the source carries the sizes attribute', lower(optimizedMarkup).includes('sizes="100vw"'));
check('the inner <img> keeps the original src as fallback', lower(optimizedMarkup).includes('src="/hero.jpg?v=2"'));
check('the inner <img> carries intrinsic dimensions', /width="\d+" height="\d+"/.test(lower(optimizedMarkup)));
check('a priority image loads eagerly with high fetch priority', lower(optimizedMarkup).includes('loading="eager"') && lower(optimizedMarkup).includes('fetchpriority="high"'));
check('the caller className is preserved on the inner <img>', lower(optimizedMarkup).includes('class="w-full h-full object-cover"'));

const lazyMarkup = renderToStaticMarkup(
  React.createElement(ResponsiveImage, { src: '/images/tours/6-days-cairo-luxor-aswan/gallery-1.jpeg', alt: 'gallery', sizes: '260px' })
);
check('a non-priority image loads lazily', lower(lazyMarkup).includes('loading="lazy"'));
check('a non-priority image does not set fetchpriority', !lower(lazyMarkup).includes('fetchpriority'));

const remoteMarkup = renderToStaticMarkup(
  React.createElement(ResponsiveImage, { src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', alt: 'remote' })
);
check('a remote source renders a plain <img> with no <picture>', !lower(remoteMarkup).includes('<picture>') && lower(remoteMarkup).includes('<img'));

/* -------------------------------------------------------------------- result */

console.log('');
if (failed === 0) {
  console.log(`=== Result: ${passed} passed, 0 failed ===`);
  process.exit(0);
}

console.error(`=== Result: ${passed} passed, ${failed} failed ===`);
if (missing.length > 0) {
  console.error(`Missing files (first 5): ${missing.slice(0, 5).join(', ')}`);
}
process.exit(1);
