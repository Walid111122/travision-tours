import type { ImgHTMLAttributes } from 'react';
import { buildWebpSrcSet, getImageEntry } from '../utils/responsiveImage';

type ResponsiveImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt: string;
  /**
   * Describes how wide the image is rendered at each breakpoint, so the browser
   * picks the smallest sufficient variant. Defaults to full viewport width.
   */
  sizes?: string;
  /**
   * Marks the primary above-the-fold image. Everything else loads lazily.
   */
  priority?: boolean;
};

/**
 * A drop-in replacement for `<img>` that serves responsive, optimized WebP with
 * an intrinsic size so the layout does not shift while it loads.
 *
 * The `<picture>` wrapper is `display: contents` (see src/index.css), so the
 * inner `<img>` keeps exactly the layout it had before — swapping `<img>` for
 * this component changes no styling.
 *
 * Sources without generated variants — remote stock URLs, for instance — render
 * as a plain `<img>`, so this is always safe to use.
 */
export default function ResponsiveImage({
  src,
  alt,
  sizes = '100vw',
  priority = false,
  loading,
  decoding,
  fetchPriority,
  ...rest
}: ResponsiveImageProps) {
  const entry = getImageEntry(src);

  const resolvedLoading = loading ?? (priority ? 'eager' : 'lazy');
  const resolvedDecoding = decoding ?? (priority ? 'sync' : 'async');
  const resolvedFetchPriority = fetchPriority ?? (priority ? 'high' : undefined);

  if (!entry) {
    return (
      <img
        src={src}
        alt={alt}
        loading={resolvedLoading}
        decoding={resolvedDecoding}
        fetchPriority={resolvedFetchPriority}
        {...rest}
      />
    );
  }

  return (
    <picture>
      <source type="image/webp" srcSet={buildWebpSrcSet(entry)} sizes={sizes} />
      <img
        src={src}
        alt={alt}
        width={entry.width}
        height={entry.height}
        loading={resolvedLoading}
        decoding={resolvedDecoding}
        fetchPriority={resolvedFetchPriority}
        {...rest}
      />
    </picture>
  );
}
