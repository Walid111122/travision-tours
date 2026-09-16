import { expect, test } from '@playwright/test';
import { isoDateIn, open, openNavIfCollapsed } from './helpers';

/**
 * Administration dashboard end-to-end coverage.
 *
 * The e2e worker runs ENVIRONMENT=development with ACCESS_DEV_BYPASS=true, so
 * the browser reaches the dashboard as `dev-bypass@localhost`. That is exactly
 * what a local operator sees — the production boundary (real Access JWTs,
 * fail-closed behaviour) is covered in tests/unit/worker-boundaries.test.ts
 * and cannot be exercised in a development instance.
 *
 * The suite also pins the *public* invariants: no admin link anywhere a
 * visitor could find it, and a noindex shell that contains no data.
 */

const SECTIONS = [
  'Overview',
  'Tours & trips',
  'Blog',
  'Inquiries',
  'Quotations',
  'Media',
  'Revisions',
  'Audit log',
  'Settings'
] as const;

test.describe('administration dashboard', () => {
  test('renders the full dashboard under the development bypass', async ({ page }) => {
    await open(page, '/admin');

    const nav = page.getByRole('navigation', { name: 'Administration sections' });
    for (const label of SECTIONS) {
      await expect(nav.getByRole('button', { name: label })).toBeVisible();
    }
    await expect(nav.getByRole('button', { name: 'Sign out' })).toBeVisible();
    await expect(page.locator('header h1')).toHaveText('Overview');

    // The bypass banner is mandatory — a dashboard without it would mean the
    // flag was silently lost.
    await expect(
      page.getByText(/local development auth bypass/i)
    ).toBeVisible();

    // Overview tiles render real counts.
    await expect(page.getByText('Published tours')).toBeVisible();
    await expect(page.getByText('New inquiries')).toBeVisible();
    await expect(page.getByText('Confirmed', { exact: true })).toBeVisible();
  });

  test('switches sections through the sidebar and updates the hash', async ({ page, isMobile }) => {
    await open(page, '/admin');
    const nav = page.getByRole('navigation', { name: 'Administration sections' });
    if (isMobile) {
      // The sidebar is a slide-over drawer on narrow viewports.
      await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
    }

    await nav.getByRole('button', { name: 'Tours & trips' }).click();
    await expect(page.locator('header h1')).toHaveText('Tours & trips');
    await expect(page).toHaveURL(/#tours$/);
    await expect(nav.getByRole('button', { name: 'Tours & trips' })).toHaveAttribute(
      'aria-current',
      'page'
    );

    if (isMobile) {
      await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
    }
    await nav.getByRole('button', { name: 'Audit log' }).click();
    await expect(page.locator('header h1')).toHaveText('Audit log');
    await expect(page).toHaveURL(/#audit$/);
  });

  test('tours section offers search and a draft-creation form', async ({ page }) => {
    await open(page, '/admin#tours');
    await expect(page.getByRole('textbox', { name: 'Search tours' })).toBeVisible();
    await page.getByRole('button', { name: /new tour/i }).click();
    await expect(page.getByText('New tour identity')).toBeVisible();
  });

  test('blog section offers search and a new-post control', async ({ page }) => {
    await open(page, '/admin#blog');
    await expect(page.getByRole('textbox', { name: 'Search posts' })).toBeVisible();
    await expect(page.getByRole('button', { name: /new post/i })).toBeVisible();
  });

  test('creates a quotation draft through the UI and lists it', async ({ page }) => {
    await open(page, '/admin#quotations');
    await page.getByRole('button', { name: /new quotation/i }).click();
    await expect(page.getByText(/TQ-\d{8}-/)).toBeVisible();
  });

  test('lists an inquiry submitted through the public form', async ({ page, request }) => {
    // Seed one inquiry through the real API so the list has a row to find.
    const response = await request.post('/api/bookings', {
      data: {
        tourId: 'cairo-day-tour',
        name: 'E2E Admin Tester',
        email: 'e2e-admin@example.com',
        phone: '+201028838866',
        preferredDate: isoDateIn(45),
        adults: 2,
        children: 0,
        travelers: 2,
        contactPreference: 'email',
        turnstileToken: 'dev-token',
        partnerPaymentAcknowledged: true
      }
    });
    expect(response.status()).toBe(201);
    const { booking } = await response.json();

    await open(page, '/admin#inquiries');
    await page.getByRole('textbox', { name: 'Booking reference' }).fill(booking.reference);
    await expect(page.getByText(booking.reference)).toBeVisible();
  });

  test('audit log records dashboard activity', async ({ page }) => {
    await open(page, '/admin#audit');
    // Earlier tests in this serial suite have already created quotations and
    // inquiries, so the log cannot be empty.
    await expect(page.getByText('dev-bypass@localhost').first()).toBeVisible();
  });

  test('settings shows the readiness checklist', async ({ page }) => {
    await open(page, '/admin#settings');
    await expect(
      page.getByText(/deferred|domain|access|readiness/i).first()
    ).toBeVisible();
  });
});

test.describe('public invariants', () => {
  test('no public page links to /admin', async ({ page }) => {
    for (const path of ['/', '/tours', '/blog', '/contact', '/about']) {
      await open(page, path);
      await openNavIfCollapsed(page);
      await expect(page.locator('a[href="/admin"], a[href^="/admin/"]')).toHaveCount(0);
    }
  });

  test('/admin prerenders a noindex shell with no data', async ({ page }) => {
    const response = await page.request.get('/admin');
    const html = await response.text();
    expect(html).toContain('noindex');
    expect(html).toContain('Checking operator access');
    expect(html).not.toContain('dev-bypass@localhost');
  });

  test('robots.txt disallows /admin', async ({ page }) => {
    const response = await page.request.get('/robots.txt');
    const text = await response.text();
    expect(text).toMatch(/Disallow:\s*\/admin/);
  });

  test('the admin session endpoint is the only unauthenticated data path', async ({ page }) => {
    // /session itself must work (it is how the gate learns whether the request
    // is authorised) — but it exposes nothing beyond the verified identity.
    const response = await page.request.get('/api/admin/session');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.email).toBe('dev-bypass@localhost');
    expect(body.devBypass).toBe(true);
    expect(Object.keys(body).sort()).toEqual([
      'authorized',
      'devBypass',
      'email',
      'environment'
    ]);
  });
});

test.describe('keyboard and viewport behaviour', () => {
  test('sidebar navigation is keyboard-operable', async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), 'covered by the mobile project below');
    await open(page, '/admin');

    // Focus the sidebar, then activate a section with the keyboard alone.
    const toursButton = page
      .getByRole('navigation', { name: 'Administration sections' })
      .getByRole('button', { name: 'Tours & trips' });
    await toursButton.focus();
    await expect(toursButton).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('header h1')).toHaveText('Tours & trips');
  });

  test('narrow viewports warn about large editing workflows', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'only meaningful on the mobile project');
    await open(page, '/admin');
    await expect(page.getByText(/narrow viewport/i)).toBeVisible();
    await page.getByRole('button', { name: 'Dismiss' }).click();
    await expect(page.getByText(/narrow viewport/i)).not.toBeVisible();
  });

  test('mobile navigation opens and closes via the drawer', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'only meaningful on the mobile project');
    await open(page, '/admin');
    const nav = page.getByRole('navigation', { name: 'Administration sections' });
    await expect(nav).not.toBeInViewport();
    // 'Open navigation' (admin drawer), not 'Open navigation menu' (public nav).
    await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
    await expect(nav).toBeInViewport();
    await page.getByRole('button', { name: 'Blog' }).click();
    await expect(page.locator('header h1')).toHaveText('Blog');
  });
});
