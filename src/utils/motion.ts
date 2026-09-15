/**
 * Motion helpers that respect the visitor's reduced-motion preference.
 *
 * `window.scrollTo({ behavior: 'smooth' })` and `Element.scrollIntoView()`
 * ignore the `prefers-reduced-motion` media query — the CSS rule in index.css
 * cannot reach them. Anywhere the app scrolls the page it has to opt out of
 * smooth scrolling itself, which is what these wrappers are for.
 */

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Scroll so that `element` sits `offset` px below the top of the viewport. */
export function scrollToElement(element: HTMLElement | null, offset = 0): void {
  if (!element) return;
  scrollToPosition(element.getBoundingClientRect().top + window.scrollY - offset);
}

/** Scroll to an absolute vertical position. */
export function scrollToPosition(top: number): void {
  window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}

/** Scroll back to the top of the document. */
export function scrollToTop(): void {
  scrollToPosition(0);
}
