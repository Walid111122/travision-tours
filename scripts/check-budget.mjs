/**
 * Enforce the image and font performance budgets.
 *
 *   node scripts/check-budget.mjs
 *
 * Run after `npm run optimize:images`. Exits non-zero if anything is over
 * budget, so it can be wired into CI or a pre-deploy check.
 *
 * Budgets are per *asset*, not per page: a page only ever downloads the one
 * variant the browser picks, so the meaningful limit is on the largest variant
 * of each image.
 */

import { readFileSync, statSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const publicDir = path.join(root, 'public');
const manifestPath = path.join(root, 'src', 'generated', 'imageManifest.json');
const fontsDir = path.join(publicDir, 'fonts');

const KB = 1024;

/**
 * Per-image budgets, keyed by the role the image plays in the layout.
 *
 * `hero` is the full-bleed above-the-fold photograph; everything else is a
 * card, thumbnail or gallery tile, which is never rendered wider than ~600px
 * on the largest breakpoint.
 */
const IMAGE_BUDGETS = {
  hero: 800 * KB,
  card: 300 * KB
};

/** No deployed asset of any kind may exceed this. */
const ABSOLUTE_CEILING = 1024 * KB;

/** Fonts: the two preloaded faces are the ones on the critical path. */
const FONT_BUDGET = {
  perFile: 120 * KB,
  total: 700 * KB
};

/** Total deployed image payload (variants + JPEG fallbacks). */
const TOTAL_IMAGE_BUDGET = 60 * 1024 * KB;

const violations = [];
const notes = [];

function fail(message) {
  violations.push(message);
}

function roleFor(publicPath) {
  return publicPath === '/hero.jpg' ? 'hero' : 'card';
}

function sizeOf(file) {
  try {
    return statSync(file).size;
  } catch {
    return null;
  }
}

function format(bytes) {
  return bytes >= KB ? `${(bytes / KB).toFixed(0)} KB` : `${bytes} B`;
}

/* ------------------------------------------------------------------ images */

if (!existsSync(manifestPath)) {
  console.error('No image manifest found. Run `npm run optimize:images` first.');
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const entries = Object.entries(manifest);

let imageBytes = 0;
let variantCount = 0;
const overBudget = [];

for (const [publicPath, entry] of entries) {
  const role = roleFor(publicPath);
  const budget = IMAGE_BUDGETS[role];

  // JPEG fallback, served at the original public path.
  const fallbackFile = path.join(publicDir, publicPath.replace(/^\//, ''));
  const fallbackSize = sizeOf(fallbackFile);
  if (fallbackSize === null) {
    fail(`missing JPEG fallback for ${publicPath}`);
  } else {
    imageBytes += fallbackSize;
    if (fallbackSize > ABSOLUTE_CEILING) {
      fail(`${publicPath} fallback is ${format(fallbackSize)} — over the 1 MB ceiling`);
    }
  }

  for (const variant of entry.variants) {
    const file = path.join(publicDir, variant.src.replace(/^\//, ''));
    const size = sizeOf(file);
    if (size === null) {
      fail(`missing variant ${variant.src}`);
      continue;
    }

    variantCount += 1;
    imageBytes += size;

    if (size > ABSOLUTE_CEILING) {
      fail(`${variant.src} is ${format(size)} — over the 1 MB ceiling`);
    } else if (size > budget) {
      overBudget.push({ src: variant.src, size, budget, role });
    }
  }
}

for (const item of overBudget) {
  fail(`${item.src} is ${format(item.size)} — over the ${item.role} budget of ${format(item.budget)}`);
}

if (imageBytes > TOTAL_IMAGE_BUDGET) {
  fail(`total deployed image payload is ${format(imageBytes)} — over ${format(TOTAL_IMAGE_BUDGET)}`);
}

/* ------------------------------------------------------------------- fonts */

let fontTotal = 0;
let fontCount = 0;

if (!existsSync(fontsDir)) {
  fail('public/fonts/ is missing — run `npm run fonts`');
} else {
  for (const name of readdirSync(fontsDir)) {
    if (!name.endsWith('.woff2')) continue;
    const size = sizeOf(path.join(fontsDir, name));
    if (size === null) continue;
    fontTotal += size;
    fontCount += 1;
    if (size > FONT_BUDGET.perFile) {
      fail(`font ${name} is ${format(size)} — over ${format(FONT_BUDGET.perFile)} per file`);
    }
  }

  if (fontTotal > FONT_BUDGET.total) {
    fail(`fonts total ${format(fontTotal)} — over ${format(FONT_BUDGET.total)}`);
  }
}

/* --------------------------------------------- nothing oversized in public/ */

function walk(dir, base = dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, base));
    else out.push({ rel: path.relative(base, full).split(path.sep).join('/'), size: statSync(full).size });
  }
  return out;
}

const oversized = walk(publicDir)
  .filter(file => file.size > ABSOLUTE_CEILING)
  .sort((a, b) => b.size - a.size);

for (const file of oversized) {
  fail(`public/${file.rel} is ${format(file.size)} — over the 1 MB ceiling`);
}

/* ---------------------------------------------------------------- reporting */

const largestVariant = entries
  .flatMap(([, entry]) => entry.variants)
  .map(variant => ({ src: variant.src, size: sizeOf(path.join(publicDir, variant.src.replace(/^\//, ''))) ?? 0 }))
  .sort((a, b) => b.size - a.size)[0];

console.log('');
console.log('Performance budget');
console.log('------------------');
console.log(`Images        ${entries.length} sources, ${variantCount} WebP variants`);
console.log(`Payload       ${format(imageBytes)} deployed (${(imageBytes / (1024 * KB)).toFixed(1)} MB)`);
console.log(`Largest       ${format(largestVariant.size)} — ${largestVariant.src}`);
console.log(`Hero budget   ${format(IMAGE_BUDGETS.hero)}   Card budget ${format(IMAGE_BUDGETS.card)}   Ceiling ${format(ABSOLUTE_CEILING)}`);
console.log(`Fonts         ${fontCount} files, ${format(fontTotal)} total (per-file cap ${format(FONT_BUDGET.perFile)})`);
console.log('');

for (const note of notes) console.log(`  note  ${note}`);

if (violations.length === 0) {
  console.log(`OK — all ${entries.length} images and ${fontCount} fonts are within budget.`);
  process.exit(0);
}

console.error(`${violations.length} budget violation${violations.length === 1 ? '' : 's'}:`);
for (const violation of violations) console.error(`  - ${violation}`);
process.exit(1);
