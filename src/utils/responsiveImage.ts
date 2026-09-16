import manifest from '../generated/imageManifest.json';

/**
 * Index of the responsive image variants produced by
 * `scripts/optimize-images.mjs`. Keys are the public paths the catalog already
 * uses, e.g. `/images/tours/6-days-cairo-luxor-aswan/gallery-1.jpeg`.
 */
export type ImageVariant = {
  format: string;
  width: number;
  height: number;
  src: string;
};

export type ImageManifestEntry = {
  /** Intrinsic dimensions of the original photograph. */
  width: number;
  height: number;
  base: string;
  hash: string;
  variants: ImageVariant[];
};

const IMAGE_MANIFEST = manifest as Record<string, ImageManifestEntry>;

/**
 * Look up the generated variants for a source path.
 *
 * Returns `undefined` for anything not in the manifest — a remote URL or a
 * source that was never optimized. Callers fall back to a plain `<img>` in
 * that case.
 */
export function getImageEntry(src: string): ImageManifestEntry | undefined {
  // Manifest keys are bare public paths, so a cache-busting query string such as
  // `/hero.jpg?v=2` must be stripped before lookup. Variant filenames already
  // carry a content fingerprint, so the query string is not needed for caching.
  const path = src.split('?')[0].split('#')[0];
  return IMAGE_MANIFEST[path];
}

/** `srcset` for the WebP variants, smallest first. */
export function buildWebpSrcSet(entry: ImageManifestEntry): string {
  return entry.variants
    .slice()
    .sort((a, b) => a.width - b.width)
    .map(variant => `${variant.src} ${variant.width}w`)
    .join(', ');
}

/** True when the manifest has optimized variants for this source. */
export function hasOptimizedVariants(src: string): boolean {
  return getImageEntry(src) !== undefined;
}
