import { expect, test } from '@playwright/test';
import { listedTourIds, open, openNavIfCollapsed, tourDetailLinks } from './helpers';

/**
 * Plan Phase 9, browser flows 1–4:
 *
 *   1. Home to tour listing to tour details.
 *   2. Clicking anywhere on a tour card.
 *   3. Every top navigation destination.
 *   4. Mobile menu open, navigate, close, and keyboard behaviour.
 *
 * Every test in this file runs twice — once against the `desktop` project and
 * once against `mobile` — unless it is explicitly skipped because the control
 * it exercises only exists at one breakpoint.
 */

test.describe('1. Home to listing to details', () => {
  test('a visitor can go from the home page to the listing to a tour', async ({ page }) => {
    await open(page, '/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Transcending');

    await page.getByRole('link', { name: 'Explore Destinations' }).click();
    await expect(page).toHaveURL(url => url.pathname === '/tours');
    // The URL commits before the lazy Tours chunk finishes loading: the router
    // transition keeps the previous page mounted, and the home page has an h1
    // and tour links of its own. Waiting for an h1 or for `a[href^="/tours/"]`
    // to exist therefore cannot tell the listing from the page being left —
    // the first matching link can be a home-page card that is about to
    // unmount. The search box exists only in the listing, so once it is
    // visible the cards below it belong to /tours.
    await expect(page.locator('#tour-search')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const ids = await listedTourIds(page);
    expect(ids.length).toBeGreaterThan(0);

    const card = tourDetailLinks(page).first();
    const href = await card.getAttribute('href');
    expect(href).toBeTruthy();

    await card.click();
    await expect(page).toHaveURL(url => url.pathname === href);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('a tour page states its price, duration, and the no-payment rule', async ({ page }) => {
    await open(page, '/tours/6-days-cairo-luxor-aswan');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Cairo, Luxor, Aswan');

    // The headline figure is an estimate, and the page has to say so. A visitor
    // who reads a number with no qualifier will treat it as a quote.
    await expect(page.getByText(/Indicative estimate from/i).first()).toBeVisible();
    await expect(page.getByText(/does not collect payment or card details/i)).toBeVisible();
  });
});

test.describe('2. Clicking anywhere on a tour card', () => {
  test('the whole card is a link, not just its title', async ({ page }) => {
    await open(page, '/tours');

    const card = tourDetailLinks(page).first();
    const href = await card.getAttribute('href');
    expect(href).toBeTruthy();

    const box = await card.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    // Top-left (the photograph), the middle (the title block) and the
    // bottom-right (the price row). A card whose image area is inert would
    // still pass a test that only clicked the title.
    const positions = [
      { x: box.width * 0.1, y: box.height * 0.1 },
      { x: box.width * 0.5, y: box.height * 0.45 },
      { x: box.width * 0.8, y: box.height * 0.9 }
    ];

    for (const position of positions) {
      await open(page, '/tours');
      await tourDetailLinks(page).first().click({ position });
      await expect(page).toHaveURL(url => url.pathname === href);
    }
  });
});

test.describe('3. Every top navigation destination', () => {
  /**
   * The destinations that exist at both breakpoints. The desktop-only entry
   * points are covered separately below, because claiming they work on a phone
   * would be a test that passes without testing anything.
   */
  const DESTINATIONS = [
    { label: 'Home', path: '/' },
    { label: 'Travel Packages', path: '/tours?type=packages' },
    { label: 'Day Tours', path: '/tours?type=daytours' },
    { label: 'Nile Cruises', path: '/tours?type=cruises' },
    { label: 'Shore Excursions', path: '/tours?type=shore' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' }
  ];

  for (const destination of DESTINATIONS) {
    test(`"${destination.label}" goes to ${destination.path}`, async ({ page }) => {
      await open(page, '/');
      await openNavIfCollapsed(page);

      await page.getByRole('link', { name: destination.label, exact: true }).click();

      await expect(page).toHaveURL(url => `${url.pathname}${url.search}` === destination.path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });
  }

  test('"Tailor-Made Tour" opens the planner', async ({ page }) => {
    await open(page, '/');
    await openNavIfCollapsed(page);

    await page.getByRole('link', { name: 'Tailor-Made Tour' }).click();
    await expect(page).toHaveURL(url => url.pathname === '/planner');
  });

  test('the search icon opens the full listing', async ({ page }, testInfo) => {
    // The icon sits in the desktop-only action group. On a phone there is no
    // direct route to `/tours` from the header at all — the listing is reached
    // from the footer or from a home-page card. That is a real gap in the
    // mobile header, recorded here rather than papered over by a test that
    // pretends the icon exists.
    test.skip(testInfo.project.name === 'mobile', 'the search icon is desktop-only');

    await open(page, '/');
    await page.getByRole('link', { name: 'Search tours' }).click();
    await expect(page).toHaveURL(url => url.pathname === '/tours');
  });

  test('the top bar links to the booking and payment policies', async ({ page }) => {
    await open(page, '/');

    // `exact` matters here: accessible-name matching is a substring search by
    // default, so the footer's "Booking & Payment Policies" also matches and
    // the locator resolves to two elements.
    await page.getByRole('link', { name: 'Booking & Payment', exact: true }).click();
    await expect(page).toHaveURL(url => url.pathname === '/policies');
  });

  test('the footer reaches every resource page', async ({ page }) => {
    await open(page, '/');

    const footer = page.getByRole('contentinfo');
    for (const [label, path] of [
      ['Cultural Etiquette & Safety', '/guidelines'],
      ['Itinerary Planner', '/planner'],
      ['About Travision Tours', '/about'],
      ['Contact Us', '/contact'],
      ['Booking & Payment Policies', '/policies']
    ] as const) {
      await expect(footer.getByRole('link', { name: label, exact: true })).toHaveAttribute(
        'href',
        path
      );
    }
  });
});

test.describe('4. Mobile menu behaviour', () => {
  test('the menu opens, navigates, closes, and works from the keyboard', async ({
    page
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'the menu button only exists below the lg breakpoint');

    const openButton = page.getByRole('button', { name: 'Open navigation menu' });
    const closeButton = page.getByRole('button', { name: 'Close navigation menu' });
    const panel = page.locator('#mobile-navigation');

    // Start away from the home page so that activating a menu link is
    // observable: from `/about`, landing on `/` can only have come from the
    // link being followed.
    await open(page, '/about');

    await expect(openButton).toHaveAttribute('aria-expanded', 'false');
    await expect(panel).toHaveCount(0);

    // --- Open with the keyboard -------------------------------------------------
    await openButton.focus();
    await expect(openButton).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(closeButton).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toBeVisible();

    // --- Tab moves into the panel, and Enter follows the link -------------------
    await page.keyboard.press('Tab');
    const focusInsidePanel = await page.evaluate(() => {
      const element = document.getElementById('mobile-navigation');
      return Boolean(element) && element!.contains(document.activeElement);
    });
    expect(focusInsidePanel).toBe(true);

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(url => url.pathname === '/');
    await expect(panel).toHaveCount(0);
    await expect(openButton).toHaveAttribute('aria-expanded', 'false');

    // --- Navigating by pointer closes the menu ----------------------------------
    await openNavIfCollapsed(page);
    await page.getByRole('link', { name: 'Contact', exact: true }).click();
    await expect(page).toHaveURL(url => url.pathname === '/contact');
    await expect(panel).toHaveCount(0);

    // --- The toggle also closes it ----------------------------------------------
    await openNavIfCollapsed(page);
    await expect(panel).toBeVisible();
    await closeButton.click();
    await expect(panel).toHaveCount(0);
    await expect(openButton).toHaveAttribute('aria-expanded', 'false');
  });
});
