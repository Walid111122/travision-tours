import { expect, test, type Page } from '@playwright/test';
import { BOOKING_REFERENCE, isoDateIn, open, waitForHydration } from './helpers';

/**
 * Plan Phase 9, browser flow 11:
 *
 *  11. Planner add, reorder, save, restore, and submit.
 *
 * The planner keeps its selection in `localStorage` under
 * `travision-itinerary`, so the restore step is a genuine reload rather than a
 * re-read of component state.
 */

const STORAGE_KEY = 'travision-itinerary';

/** Planner stop IDs, taken from `src/plannerStops.ts`. */
const PYRAMIDS = '1';
const KARNAK = '15';

const addStop = (page: Page, title: string) =>
  page.getByRole('button', { name: `Add ${title} to your itinerary` });

/** The written preview in the right-hand column, in order. */
const previewTitles = (page: Page) => page.locator('ol li h3');

test.describe('11. Itinerary planner', () => {
  test('a visitor can add, reorder, save, restore, and submit an itinerary', async ({ page }) => {
    await open(page, '/planner');

    // --- Add -------------------------------------------------------------------
    await expect(page.getByText('The sands are empty.')).toBeVisible();
    await addStop(page, 'Pyramids of Giza').click();
    await addStop(page, 'Karnak Temple Complex').click();

    await expect(previewTitles(page)).toHaveText(['Pyramids of Giza', 'Karnak Temple Complex']);
    await expect(page.getByText('2 stops selected')).toBeVisible();

    // The first stop cannot move up and the last cannot move down.
    await expect(
      page.getByRole('button', { name: 'Move Pyramids of Giza earlier in your itinerary' })
    ).toBeDisabled();
    await expect(
      page.getByRole('button', { name: 'Move Karnak Temple Complex later in your itinerary' })
    ).toBeDisabled();

    // --- Reorder ---------------------------------------------------------------
    await page
      .getByRole('button', { name: 'Move Karnak Temple Complex earlier in your itinerary' })
      .click();
    await expect(previewTitles(page)).toHaveText(['Karnak Temple Complex', 'Pyramids of Giza']);

    // --- Save ------------------------------------------------------------------
    await page.getByRole('button', { name: 'Save itinerary on this device' }).click();
    await expect(page.getByRole('status')).toContainText('Itinerary saved on this device.');

    const saved = await page.evaluate(key => window.localStorage.getItem(key), STORAGE_KEY);
    expect(JSON.parse(saved ?? '[]')).toEqual([KARNAK, PYRAMIDS]);

    // --- Restore ---------------------------------------------------------------
    await page.reload();
    await waitForHydration(page);

    await expect(previewTitles(page)).toHaveText(['Karnak Temple Complex', 'Pyramids of Giza']);
    await expect(page.getByText('2 stops selected')).toBeVisible();

    // --- Submit ----------------------------------------------------------------
    await page.getByRole('button', { name: 'Request this itinerary' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('2 stops selected. Sending this is a request, not a reservation.');

    await dialog.locator('#planner-name').fill('Ada Lovelace');
    await dialog.locator('#planner-email').fill('ada@example.com');
    await dialog.locator('#planner-phone').fill('+201234567890');
    await dialog.locator('#planner-country').fill('United Kingdom');
    await dialog.locator('#planner-date').fill(isoDateIn(45));
    await dialog.locator('input[name="partnerPaymentAcknowledged"]').check();

    const requestPromise = page.waitForRequest(
      request => request.url().includes('/api/bookings') && request.method() === 'POST'
    );
    await dialog.getByRole('button', { name: 'Send request' }).click();

    // The order the visitor arranged has to be the order that is sent. A planner
    // that displays one sequence and submits another is worse than no planner.
    const payload = JSON.parse((await requestPromise).postData() ?? '{}');
    expect(payload.source).toBe('planner');
    expect(payload.itineraryStopIds).toEqual([KARNAK, PYRAMIDS]);

    await expect(dialog.getByRole('status')).toContainText('This is a request, not a confirmed reservation.');
    await expect(dialog.getByRole('status')).toContainText(BOOKING_REFERENCE);
  });

  test('the request form cannot be opened with nothing selected', async ({ page }) => {
    await open(page, '/planner');

    await expect(page.getByRole('button', { name: 'Request this itinerary' })).toBeDisabled();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('a stop can be removed, and searching filters the landmark list', async ({ page }) => {
    await open(page, '/planner');

    await addStop(page, 'Pyramids of Giza').click();
    await expect(previewTitles(page)).toHaveText(['Pyramids of Giza']);

    await page
      .getByRole('button', { name: 'Remove Pyramids of Giza from your itinerary' })
      .click();
    await expect(page.getByText('The sands are empty.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Request this itinerary' })).toBeDisabled();

    // The landmark search narrows the available list and reports an empty result
    // rather than silently showing nothing.
    const search = page.getByLabel('Search landmarks');
    await search.fill('zzzz-no-such-landmark');
    await expect(page.getByText('No landmarks match that search.')).toBeVisible();

    await search.fill('Karnak');
    await expect(addStop(page, 'Karnak Temple Complex')).toBeVisible();
    await expect(addStop(page, 'Pyramids of Giza')).toHaveCount(0);
  });
});
