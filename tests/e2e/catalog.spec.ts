import { expect, test } from '@playwright/test';
import { listedTourIds, open } from './helpers';

/**
 * Plan Phase 9, browser flows 5–7:
 *
 *   5. Package / Day Tour / Nile Cruise / Shore filters.
 *   6. Search, no-results, and reset behaviour.
 *   7. Related tours use the correct links and images.
 *
 * The expected counts are pinned to the current catalog. They are deliberately
 * exact rather than "greater than zero": a filter that silently starts showing
 * the wrong collection is precisely the regression these tests exist to catch,
 * and a loose assertion would let it through. When a tour is added or removed,
 * update the number here and in `tests/unit/catalog.test.ts` together.
 */

const COLLECTIONS = [
  {
    type: 'all',
    path: '/tours',
    heading: 'Discover the Unseen',
    count: 12,
    member: '6-days-cairo-luxor-aswan'
  },
  {
    type: 'packages',
    path: '/tours?type=packages',
    heading: 'Discover the Unseen',
    count: 9,
    member: '6-days-cairo-luxor-aswan'
  },
  {
    type: 'daytours',
    path: '/tours?type=daytours',
    heading: 'Egypt Day Tours',
    count: 22,
    member: 'luxor-day-tour'
  },
  {
    type: 'cruises',
    path: '/tours?type=cruises',
    heading: 'Discover the Unseen',
    count: 2,
    member: '8-days-budget-egypt-complete-tour'
  },
  {
    type: 'shore',
    path: '/tours?type=shore',
    heading: 'Shore Excursions',
    count: 7,
    member: 'hurghada-day-tour'
  }
] as const;

test.describe('5. Collection filters', () => {
  for (const collection of COLLECTIONS) {
    test(`"${collection.type}" shows its own tours and nothing else`, async ({ page }) => {
      await open(page, collection.path);

      // The heading proves the `type` parameter actually took effect. Asserting
      // only on the URL would pass even if the page ignored the filter.
      await expect(page.getByRole('heading', { level: 1 })).toContainText(collection.heading);

      const ids = await listedTourIds(page);
      expect(ids).toHaveLength(collection.count);
      expect(ids).toContain(collection.member);
    });
  }

  test('Shore Excursions excludes the inland White Desert tour', async ({ page }) => {
    // The White Desert carries the `adventure` category, so an earlier version
    // of this filter inferred membership from the category and listed a desert
    // camp under sea excursions. Membership is now declared explicitly; this
    // pins the reason that change was made.
    await open(page, '/tours?type=shore');

    const ids = await listedTourIds(page);
    expect(ids).not.toContain('white-desert-day-tour');
    expect(ids).toContain('hurghada-day-tour');
  });

  test('the unfiltered listing currently reaches only the package catalog', async ({ page }) => {
    // KNOWN DEFECT, recorded here and as an expected failure in
    // `tests/unit/catalog.test.ts`.
    //
    // `isInCollection(id, 'all')` accepts every tour, but
    // `getCollectionSource('all')` returns only `SAMPLE_TOURS`. The 22 day tours
    // are therefore unreachable from `/tours` — the page the header's search
    // icon opens. A visitor searching for "Hurghada" on that page is told there
    // are no matches while the day-tour catalog holds one.
    //
    // This test asserts the current behaviour so the defect is visible in the
    // report rather than silently accepted. It will need rewriting when the
    // source is corrected.
    await open(page, '/tours');

    const ids = await listedTourIds(page);
    expect(ids).toContain('6-days-cairo-luxor-aswan');
    expect(ids).not.toContain('luxor-day-tour');
  });
});

test.describe('6. Search, no results, and reset', () => {
  test('a search narrows the listing and clearing it restores the full list', async ({ page }) => {
    await open(page, '/tours');

    const search = page.getByLabel('Search tours by city or landmark');
    await expect(search).toBeVisible();

    await search.fill('Hurghada');
    await expect.poll(() => listedTourIds(page)).toHaveLength(1);
    await expect(page.getByRole('heading', { name: /Hurghada Vacation/i })).toBeVisible();

    await search.fill('');
    await expect.poll(() => listedTourIds(page)).toHaveLength(12);
  });

  test('a search with no matches offers a reset that clears every filter', async ({ page }) => {
    await open(page, '/tours');

    const search = page.getByLabel('Search tours by city or landmark');
    await search.fill('zzzz-no-such-destination');

    await expect(page.getByRole('heading', { name: 'No Journeys Found' })).toBeVisible();
    await expect(page.getByText('Adjust your filters to discover other paths.')).toBeVisible();

    const reset = page.getByRole('button', { name: 'Reset Explorations' });
    await expect(reset).toBeVisible();
    await reset.click();

    await expect(search).toHaveValue('');
    await expect.poll(() => listedTourIds(page)).toHaveLength(12);
    await expect(page.getByRole('heading', { name: 'No Journeys Found' })).toHaveCount(0);
  });
});

test.describe('7. Related tours', () => {
  test('related tours link to other tours and their images load', async ({ page }) => {
    await open(page, '/tours/6-days-cairo-luxor-aswan');

    const related = page.locator('#related');
    await expect(related.getByRole('heading', { name: 'Related Tours' })).toBeVisible();
    await related.scrollIntoViewIfNeeded();

    const links = related.locator('a[href^="/tours/"]');
    await expect(links).toHaveCount(3);

    const hrefs = await links.evaluateAll(nodes =>
      nodes.map(node => node.getAttribute('href') ?? '')
    );

    // Three distinct tours, none of them the page you are already on.
    expect(new Set(hrefs).size).toBe(3);
    for (const href of hrefs) {
      expect(href).toMatch(/^\/tours\/[a-z0-9-]+$/);
      expect(href).not.toBe('/tours/6-days-cairo-luxor-aswan');
    }

    const images = related.locator('img');
    await expect(images).toHaveCount(3);

    for (const image of await images.all()) {
      await expect(image).toHaveAttribute('alt', /\S/);
      // `naturalWidth` is zero until the browser has decoded the file, so this
      // distinguishes "an <img> exists" from "the photograph actually loads" —
      // a broken path still renders an element.
      await expect
        .poll(async () => image.evaluate(element => (element as HTMLImageElement).naturalWidth))
        .toBeGreaterThan(0);
    }
  });

  test('following a related tour opens that tour', async ({ page }) => {
    await open(page, '/tours/6-days-cairo-luxor-aswan');

    const related = page.locator('#related');
    await related.scrollIntoViewIfNeeded();

    const link = related.locator('a[href^="/tours/"]').first();
    const href = await link.getAttribute('href');

    await link.click();
    await expect(page).toHaveURL(url => url.pathname === href);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
