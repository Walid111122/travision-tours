/**
 * Generate responsive, optimized image variants.
 *
 *   node scripts/optimize-images.mjs            # generate
 *   node scripts/optimize-images.mjs --clean    # regenerate from scratch
 *
 * Source of truth is `image-originals/`, which sits OUTSIDE the deployed asset
 * directory so multi-megabyte photographs are never shipped. On first run the
 * script copies the current `public/images` + `public/hero.jpg` into
 * `image-originals/` before touching anything, so the originals are preserved.
 *
 * Outputs, all under `public/`:
 *   public/images/<path>                     optimized JPEG fallback (~960px)
 *   public/images/opt/<path>-<w>.<hash>.webp responsive WebP
 *   src/generated/imageManifest.json         intrinsic size + variant index
 *
 * Only WebP is generated per width. WebP has been supported by every current
 * browser for years, and the single JPEG fallback at the original path covers
 * anything older — so per-width JPEG copies would have added ~28 MB of assets
 * that are effectively never requested.
 *
 * Filenames carry a content fingerprint, so they can be cached immutably.
 */

import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, copyFile, rm, stat } from 'node:fs/promises';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('..', import.meta.url));
const publicDir = path.join(root, 'public');
const originalsDir = path.join(root, 'image-originals');
const generatedDir = path.join(root, 'src', 'generated');
const manifestPath = path.join(generatedDir, 'imageManifest.json');

/** Widths generated for every image. A width wider than the source is skipped. */
const WIDTHS = [480, 960, 1440];

/** The width used for the single JPEG fallback served at the original path. */
const FALLBACK_WIDTH = 960;

const WEBP_OPTIONS = { quality: 78, effort: 4 };
const JPEG_OPTIONS = { quality: 80, mozjpeg: true, progressive: true };

const IMAGE_PATTERN = /\.(jpe?g|png)$/i;

const clean = process.argv.includes('--clean');
const pruneOnly = process.argv.includes('--prune-only');

function walk(dir, base = dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full, base));
    } else if (IMAGE_PATTERN.test(entry.name)) {
      results.push(path.relative(base, full).split(path.sep).join('/'));
    }
  }
  return results;
}

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

/** Every file under `dir`, as paths relative to it. */
function walkAll(dir, base = dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walkAll(full, base));
    else results.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return results;
}

/**
 * Remove variants that the current run did not produce (for example, files left
 * behind by an earlier configuration).
 *
 * Deletion is deliberately batched: the environment blocks large bulk deletes,
 * so this removes at most `PRUNE_BATCH` files per run and reports anything left.
 */
const PRUNE_BATCH = 40;

async function pruneStaleVariants(expected) {
  const optDir = path.join(publicDir, 'images', 'opt');
  if (!(await exists(optDir))) return 0;

  const stale = walkAll(optDir).filter(rel => !expected.has(`/images/opt/${rel}`));
  if (stale.length === 0) return 0;

  for (const rel of stale.slice(0, PRUNE_BATCH)) {
    await rm(path.join(optDir, rel), { force: true });
  }

  const remaining = stale.length - Math.min(stale.length, PRUNE_BATCH);
  console.log(
    remaining > 0
      ? `  pruned ${PRUNE_BATCH} stale variants; ${remaining} still remain — run again to continue.`
      : `  pruned ${stale.length} stale variants.`
  );
  return remaining;
}

/**
 * Copy the shipped originals into `image-originals/` the first time this runs,
 * so the original photographs are never lost when `public/` is overwritten.
 */
async function ensureOriginals() {
  if (await exists(originalsDir)) {
    console.log('image-originals/ already present — using it as the source.');
    return;
  }

  console.log('First run: copying originals out of public/ into image-originals/ ...');
  const sources = [];
  const imagesRoot = path.join(publicDir, 'images');
  if (await exists(imagesRoot)) {
    for (const rel of walk(imagesRoot)) sources.push({ from: path.join(imagesRoot, rel), to: path.join(originalsDir, 'images', rel) });
  }
  const heroPath = path.join(publicDir, 'hero.jpg');
  if (await exists(heroPath)) sources.push({ from: heroPath, to: path.join(originalsDir, 'hero.jpg') });

  let bytes = 0;
  for (const { from, to } of sources) {
    await mkdir(path.dirname(to), { recursive: true });
    await copyFile(from, to);
    bytes += (await stat(to)).size;
  }
  console.log(`  copied ${sources.length} files (${(bytes / 1048576).toFixed(1)} MB)`);
}

/** `/images/tours/x/gallery-1.jpeg` -> `tours/x/gallery-1`; `/hero.jpg` -> `hero`. */
function variantBase(publicPath) {
  return publicPath
    .replace(IMAGE_PATTERN, '')
    .replace(/^\/images\//, '')
    .replace(/^\//, '');
}

function fingerprint(buffer, relPath, width, format) {
  return createHash('sha256')
    .update(buffer)
    .update(`${relPath}|${width}|${format}`)
    .digest('hex')
    .slice(0, 8);
}

async function generate() {
  await ensureOriginals();

  const optDir = path.join(publicDir, 'images', 'opt');
  /** Public paths of every variant this run produces, used to prune the rest. */
  const expectedVariants = new Set();

  const relPaths = walk(originalsDir);
  console.log(`Optimizing ${relPaths.length} source images at widths ${WIDTHS.join(', ')} ...`);

  const manifest = {};
  let sourceBytes = 0;
  let outputBytes = 0;
  let skipped = 0;

  for (const [index, rel] of relPaths.entries()) {
    const sourcePath = path.join(originalsDir, rel);
    const sourceBuffer = await readFile(sourcePath);
    sourceBytes += sourceBuffer.length;

    // Public path the application already references, e.g.
    // image-originals/images/tours/x/gallery-1.jpeg -> /images/tours/x/gallery-1.jpeg
    const publicPath = `/${rel}`;
    const base = variantBase(publicPath);

    const image = sharp(sourceBuffer).rotate(); // bake in EXIF orientation
    const meta = await image.metadata();
    const intrinsicWidth = meta.width;
    const intrinsicHeight = meta.height;

    if (!intrinsicWidth || !intrinsicHeight) {
      console.warn(`  skip  ${rel} (no dimensions)`);
      skipped += 1;
      continue;
    }

    const widths = WIDTHS.filter(w => w <= intrinsicWidth);
    if (widths.length === 0) widths.push(intrinsicWidth);

    const hash = fingerprint(sourceBuffer, rel, 0, 'v1');
    const variants = [];

    for (const width of widths) {
      const target = path.join(optDir, `${base}-${width}.${hash}.webp`);
      await mkdir(path.dirname(target), { recursive: true });

      // Metadata is dropped by default: sharp only keeps it if asked.
      const buffer = await sharp(sourceBuffer)
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp(WEBP_OPTIONS)
        .toBuffer();

      await writeFile(target, buffer);
      outputBytes += buffer.length;

      const written = await sharp(buffer).metadata();
      const variantSrc = `/images/opt/${base}-${width}.${hash}.webp`;
      expectedVariants.add(variantSrc);
      variants.push({
        format: 'webp',
        width: written.width,
        height: written.height,
        src: variantSrc
      });
    }

    // Single optimized fallback at the original public path, so any code path
    // that still requests the plain filename keeps working.
    const fallbackWidth = Math.min(FALLBACK_WIDTH, intrinsicWidth);
    const fallbackBuffer = await sharp(sourceBuffer)
      .rotate()
      .resize({ width: fallbackWidth, withoutEnlargement: true })
      .jpeg(JPEG_OPTIONS)
      .toBuffer();

    const fallbackTarget = path.join(publicDir, publicPath);
    await mkdir(path.dirname(fallbackTarget), { recursive: true });
    await writeFile(fallbackTarget, fallbackBuffer);
    outputBytes += fallbackBuffer.length;

    manifest[publicPath] = {
      width: intrinsicWidth,
      height: intrinsicHeight,
      base: `/images/opt/${base}`,
      hash,
      variants
    };

    if ((index + 1) % 10 === 0) {
      console.log(`  ${index + 1}/${relPaths.length} processed`);
    }
  }

  await mkdir(generatedDir, { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest)}\n`, 'utf8');

  if (clean) {
    console.log('');
    console.log('--clean: pruning variants this run did not produce ...');
    await pruneStaleVariants(expectedVariants);
  }

  const entries = Object.keys(manifest).length;
  console.log('');
  console.log(`Images:      ${entries} optimized, ${skipped} skipped`);
  console.log(`Source:      ${(sourceBytes / 1048576).toFixed(1)} MB (image-originals/, not deployed)`);
  console.log(`Deployed:    ${(outputBytes / 1048576).toFixed(1)} MB across ${relPaths.length} fallbacks + variants`);
  console.log(`Reduction:   ${(100 - (outputBytes / sourceBytes) * 100).toFixed(0)}%`);
  console.log(`Manifest:    src/generated/imageManifest.json`);
}

/**
 * `--prune-only`: delete stale variants using the existing manifest as the
 * source of truth, without re-encoding anything.
 *
 * A single pass removes at most `PRUNE_BATCH` files, so after changing the
 * variant configuration run this repeatedly until it reports nothing left.
 */
async function pruneOnly_() {
  if (!(await exists(manifestPath))) {
    console.error('No manifest found — run a full pass first.');
    process.exitCode = 1;
    return;
  }

  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const expected = new Set();
  for (const entry of Object.values(manifest)) {
    for (const variant of entry.variants) expected.add(variant.src);
  }

  console.log(`Pruning against ${expected.size} variants listed in the manifest ...`);
  await pruneStaleVariants(expected);
}

const run = pruneOnly ? pruneOnly_ : generate;

run().catch(error => {
  console.error('Image optimization failed:', error);
  process.exitCode = 1;
});
