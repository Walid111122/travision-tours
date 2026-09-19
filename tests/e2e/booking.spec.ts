import { expect, test, type Page } from '@playwright/test';
import { BOOKING_REFERENCE, isoDateIn, open, SAMPLE_TOUR_PATH } from './helpers';

/**
 * Plan Phase 9, browser flows 8–10:
 *
 *   8. Booking validation errors.
 *   9. Successful booking using the local API.
 *  10. Failed and retried booking.
 *
 * These tests write real inquiries — but into the disposable local D1 that
 * `tests/e2e/serve.mjs` creates and deletes for the run, never the developer's
 * `.wrangler/state`. That is why the suite can submit successfully more than
 * once without leaving anything behind.
 *
 * Turnstile is bypassed for this instance because `ENVIRONMENT=development` and
 * `TURNSTILE_DEV_BYPASS` is set in the gitignored `.dev.vars`. The bypass is
 * asserted as active in `tests/worker/api.test.ts`; the fail-closed behaviour
 * that a browser cannot reach is covered in `tests/unit/worker-boundaries.test.ts`.
 */

/** Fills every required field. Does not tick the payment acknowledgement. */
async function fillInquiryForm(page: Page) {
  const form = page.locator('#booking-form');

  await form.locator('#inquiry-name').fill('Ada Lovelace');
  await form.locator('#inquiry-email').fill('ada@example.com');
  await form.locator('#inquiry-phone').fill('+201234567890');
  await form.locator('#inquiry-country').fill('United Kingdom');
  await form.locator('#inquiry-arrival').fill(isoDateIn(30));
  await form.locator('#inquiry-departure').fill(isoDateIn(37));
  await form.locator('#inquiry-adults').fill('2');
  await form.locator('#inquiry-children').fill('0');
  await form.locator('#inquiry-requirements').fill('Prefer a slower pace and early starts.');
}

function submitButton(page: Page) {
  return page.locator('#booking-form').getByRole('button', { name: 'Send Request' });
}

/**
 * Watches for a booking request for a short window.
 *
 * Used to prove the browser blocked a submission. The window is deliberately
 * short: the point is that no request is made at all, and a generous timeout
 * would only slow the suite down without making the assertion stronger.
 */
async function watchForBookingRequest(page: Page) {
  return page
    .waitForRequest(request => request.url().includes('/api/bookings'), { timeout: 1500 })
    .catch(() => null);
}

test.describe('8. Booking validation errors', () => {
  test('an empty form is refused before the server is contacted', async ({ page }) => {
    await open(page, SAMPLE_TOUR_PATH);

    const request = watchForBookingRequest(page);
    await submitButton(page).click();

    // The browser focuses the first control it rejected.
    await expect(page.locator('#inquiry-name')).toBeFocused();
    expect(await request).toBeNull();

    // No error summary either: nothing reached the server, so there is no
    // server message to show.
    await expect(page.locator('#booking-request-error')).toHaveCount(0);
  });

  test('the payment acknowledgement cannot be skipped', async ({ page }) => {
    await open(page, SAMPLE_TOUR_PATH);
    await fillInquiryForm(page);

    const request = watchForBookingRequest(page);
    await submitButton(page).click();

    await expect(page.locator('#inquiry-payment-acknowledgement')).toBeFocused();
    expect(await request).toBeNull();
  });

  test('a child count without ages is refused', async ({ page }) => {
    await open(page, SAMPLE_TOUR_PATH);
    await fillInquiryForm(page);
    await page.locator('#inquiry-children').fill('2');

    // The ages field becomes required, and its helper text says so.
    await expect(page.locator('#inquiry-child-ages')).toHaveAttribute('required', '');
    await expect(page.getByText('Required for each child in this inquiry.')).toBeVisible();

    const request = watchForBookingRequest(page);
    await submitButton(page).click();
    await expect(page.locator('#inquiry-child-ages')).toBeFocused();
    expect(await request).toBeNull();
  });

  test('moving the arrival date past the departure date clears the departure date', async ({
    page
  }) => {
    await open(page, SAMPLE_TOUR_PATH);

    const arrival = page.locator('#inquiry-arrival');
    const departure = page.locator('#inquiry-departure');

    await arrival.fill(isoDateIn(10));
    await departure.fill(isoDateIn(20));
    await expect(departure).toHaveValue(isoDateIn(20));

    // An inquiry for a stay that ends before it begins is not a request the
    // server should ever have to reject. The form refuses to hold the pair.
    await arrival.fill(isoDateIn(30));
    await expect(departure).toHaveValue('');

    // The departure field can never be set before the arrival date.
    await expect(departure).toHaveAttribute('min', isoDateIn(30));
  });
});

test.describe('9. Successful booking', () => {
  test('a complete inquiry is accepted and returns a booking reference', async ({ page }) => {
    await open(page, SAMPLE_TOUR_PATH);
    await fillInquiryForm(page);
    await page.locator('#inquiry-payment-acknowledgement').check();

    await submitButton(page).click();

    const confirmation = page.locator('#booking-form [role="status"]');
    await expect(confirmation).toBeVisible();

    // The confirmation has to make three things unambiguous: this is a request,
    // it has a reference, and no money has changed hands.
    await expect(confirmation).toContainText('This is a request, not a confirmed reservation.');
    await expect(confirmation).toContainText(BOOKING_REFERENCE);
    await expect(confirmation).toContainText('Egypt Online Tour');
    await expect(page.locator('#booking-form')).toContainText('does not collect payment');
  });

  test('the form is cleared after a successful submission', async ({ page }) => {
    await open(page, SAMPLE_TOUR_PATH);
    await fillInquiryForm(page);
    await page.locator('#inquiry-payment-acknowledgement').check();
    await submitButton(page).click();

    await expect(page.locator('#booking-form [role="status"]')).toBeVisible();

    // Leaving the details in place invites a second, accidental inquiry.
    await expect(page.locator('#inquiry-name')).toHaveValue('');
    await expect(page.locator('#inquiry-email')).toHaveValue('');
    await expect(page.locator('#inquiry-payment-acknowledgement')).not.toBeChecked();
  });
});

test.describe('10. Failed and retried booking', () => {
  test('a network failure is reported and the same details can be retried', async ({ page }) => {
    await open(page, SAMPLE_TOUR_PATH);

    let attempts = 0;
    await page.route('**/api/bookings', async route => {
      attempts += 1;
      if (attempts === 1) {
        // Simulates the server being unreachable rather than rejecting the
        // request — the case a visitor is most likely to meet, and the one the
        // form has to keep their typing through.
        await route.abort('failed');
        return;
      }
      await route.continue();
    });

    await fillInquiryForm(page);
    await page.locator('#inquiry-payment-acknowledgement').check();

    await submitButton(page).click();

    const error = page.locator('#booking-request-error');
    await expect(error).toBeVisible();
    await expect(error).toContainText(/could not reach the server/i);
    // Focus moves to the summary so the message is announced and the visitor is
    // not left hunting for what changed.
    await expect(error).toBeFocused();

    // Nothing the visitor typed is lost, so retrying costs one click.
    await expect(page.locator('#inquiry-name')).toHaveValue('Ada Lovelace');
    await expect(page.locator('#inquiry-email')).toHaveValue('ada@example.com');
    await expect(page.locator('#inquiry-payment-acknowledgement')).toBeChecked();

    await submitButton(page).click();

    await expect(page.locator('#booking-form [role="status"]')).toContainText(BOOKING_REFERENCE);
    await expect(error).toHaveCount(0);
    expect(attempts).toBe(2);
  });

  test('a rejected submission shows the server message and stays retryable', async ({ page }) => {
    await open(page, SAMPLE_TOUR_PATH);

    await page.route('**/api/bookings', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 'validation_error', message: 'Please check the highlighted details.' }
        })
      });
    });

    await fillInquiryForm(page);
    await page.locator('#inquiry-payment-acknowledgement').check();
    await submitButton(page).click();

    const error = page.locator('#booking-request-error');
    await expect(error).toContainText('Please check the highlighted details.');

    // The visitor's details survive a rejection too.
    await expect(page.locator('#inquiry-name')).toHaveValue('Ada Lovelace');
  });
});
