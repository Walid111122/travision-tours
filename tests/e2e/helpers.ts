import { expect, type Page } from '@playwright/test';

/**
 * Shared helpers for the browser end-to-end suite.
 *
 * The application is prerendered and then hydrated, so markup is on screen
 * before it is interactive. A test that starts clicking immediately can land on
 * a button that has no handler yet: the click does nothing and the assertion
 * fails for a reason that has nothing to do with the application. Every
 * navigation therefore goes through `open()`, which waits until React has
 * attached itself to the document.
 */

/**
 * Waits until React has hydrated (or mounted) the document.
 *
 * React records the container it took over on the container element itself, as
 * `__reactContainer$<random>`. That property is the only hydration signal the
 * app exposes — deliberately so, because adding a marker would mean changing
 * application code to make the tests pass, which inverts the relationship the
 * suite is supposed to have with the app.
 */
export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const root = document.getElementById('root');
      if (!root) return false;
      return Object.keys(root).some(key => key.startsWith('__reactContainer$'));
    },
    undefined,
    { timeout: 30_000 }
  );
}

/**
 * Navigates to a path and waits for the document to become interactive.
 *
 * Returns the main response so callers that care about the HTTP status — the
 * 404 assertions — can check it. The status is the whole point of those tests:
 * a page that renders "not found" copy while answering `200 OK` is a soft 404,
 * which search engines index as a duplicate.
 */
export async function open(page: Page, path: string) {
  const response = await page.goto(path);
  await waitForHydration(page);
  return response;
}

/**
 * Navigates without waiting for hydration.
 *
 * Only for tests that assert on the response itself. The prerendered markup is
 * already in the document, so the copy is readable even if hydration never
 * completes — which is exactly the situation a 404 test should not depend on.
 */
export async function openWithoutHydration(page: Page, path: string) {
  return page.goto(path);
}

/**
 * Reveals the navigation links on a narrow viewport.
 *
 * Below the `lg` breakpoint the desktop link list is `display: none` and the
 * links live behind the menu button, so a role query finds them only once the
 * menu is open. On a wide viewport the button is not rendered and this is a
 * no-op.
 */
export async function openNavIfCollapsed(page: Page): Promise<void> {
  const toggle = page.getByRole('button', { name: 'Open navigation menu' });
  if (!(await toggle.isVisible())) return;

  await toggle.click();
  await expect(page.getByRole('button', { name: 'Close navigation menu' })).toHaveAttribute(
    'aria-expanded',
    'true'
  );
}

/** Every link on the page that points at a single tour. */
export function tourDetailLinks(page: Page) {
  return page.locator('a[href^="/tours/"]');
}

/**
 * The distinct tour IDs a listing page is showing.
 *
 * De-duplicated because the day-tour layout links the same tour twice — once in
 * the comparison table and once in the card grid — and counting raw anchors
 * would report a number that does not correspond to the number of tours.
 */
export async function listedTourIds(page: Page): Promise<string[]> {
  const hrefs = await tourDetailLinks(page).evaluateAll(nodes =>
    nodes.map(node => node.getAttribute('href') ?? '')
  );
  return [...new Set(hrefs.map(href => href.replace(/^\/tours\//, '')).filter(Boolean))];
}

/**
 * A `YYYY-MM-DD` date, `days` from today, in local time.
 *
 * Local rather than UTC to match how the app computes its own `today`: near
 * midnight the two disagree, and a date input whose `min` is a day ahead of the
 * value being typed would reject a valid test date.
 */
export function isoDateIn(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

/** The booking reference the API issues, e.g. `TV-20260914-1A2B3C4D`. */
export const BOOKING_REFERENCE = /TV-\d{8}-[0-9A-F]{8}/;

/** The tour the booking and related-tour tests are built around. */
export const SAMPLE_TOUR_ID = '6-days-cairo-luxor-aswan';
export const SAMPLE_TOUR_PATH = `/tours/${SAMPLE_TOUR_ID}`;
