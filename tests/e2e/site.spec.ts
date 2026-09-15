import { expect, test } from '@playwright/test';
import { EMAIL_PUBLISHED } from '../../src/config/business';
import { open, openWithoutHydration } from './helpers';

/**
 * Plan Phase 9, browser flows 12–14:
 *
 *  12. Blog article flow if Blog remains public.
 *  13. Unknown page and unknown tour 404.
 *  14. Policies, contact, WhatsApp, and email links.
 */

test.describe('12. Blog stays hidden', () => {
  /**
   * The blog is not public: `src/pages/Blog.tsx` states it is hidden while the
   * first articles are written. So the flow this phase has to prove is the
   * opposite of the one the plan assumed — that the URL resolves for anyone who
   * has it bookmarked, while staying out of navigation, the sitemap, and search
   * results. Publishing a route is easy; keeping an unfinished one invisible is
   * the part that breaks silently.
   */
  test('the route resolves without being published', async ({ page }) => {
    const response = await open(page, '/blog');

    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Cultural');
    await expect(page.getByRole('heading', { name: 'Articles are being prepared' })).toBeVisible();

    // No placeholder articles, and no newsletter form before a provider and
    // privacy wording are approved.
    await expect(page.locator('article')).toHaveCount(0);
    await expect(page.getByRole('textbox')).toHaveCount(0);
  });

  test('the page is noindex and is not linked from anywhere', async ({ page }) => {
    await open(page, '/blog');

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow'
    );
    await expect(page.getByRole('link', { name: /blog/i })).toHaveCount(0);
  });

  test('the sitemap and robots.txt both exclude it', async ({ page }) => {
    const sitemap = await (await page.request.get('/sitemap.xml')).text();
    expect(sitemap).not.toContain('/blog');

    const robots = await (await page.request.get('/robots.txt')).text();
    expect(robots).toContain('Disallow: /blog');
  });
});

test.describe('13. Unknown pages', () => {
  test('an unknown path answers 404 with the not-found page', async ({ page }) => {
    const response = await openWithoutHydration(page, '/no-such-page-here');

    // A page that renders "not found" copy while answering 200 is a soft 404:
    // search engines index it as a duplicate of every other typo. The status
    // code is the assertion that matters here.
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('This path has faded');
    await expect(page.getByRole('link', { name: 'Return home' })).toBeVisible();
  });

  test('an unknown tour answers 404 with the not-found page, not a blank tour', async ({ page }) => {
    const response = await openWithoutHydration(page, '/tours/not-a-real-tour');

    expect(response?.status()).toBe(404);

    // `/tours/<anything>` matches the `/tours/:id` route, so the client resolves
    // the tour page while the host serves the 404 document. The two must agree:
    // when they did not, React failed to hydrate, threw away the server markup,
    // and rendered a bare line with no heading and no way back to the catalogue.
    // These assertions are what catch that — they fail the moment the client
    // stops rendering the same page the host serves.
    await expect(page.getByRole('heading', { level: 1 })).toContainText('This path has faded');
    await expect(page.getByRole('link', { name: 'Return home' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse tours' })).toBeVisible();
  });

  test('the not-found page does not claim to be the home page', async ({ page }) => {
    // A canonical of "/" on the 404 document tells search engines the typo and
    // the home page are the same URL. That was the bug this asserts against.
    await openWithoutHydration(page, '/no-such-page-here');
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  });

  test('a real tour still answers 200, so the 404s above mean something', async ({ page }) => {
    const response = await openWithoutHydration(page, '/tours/6-days-cairo-luxor-aswan');
    expect(response?.status()).toBe(200);
  });
});

test.describe('14. Contact, policy, and messaging links', () => {
  test('the contact page offers WhatsApp, telephone, and email', async ({ page }) => {
    await open(page, '/contact');

    // WhatsApp needs the number in international form without punctuation, or
    // the link opens an empty chat.
    await expect(page.locator('a[href^="https://wa.me/"]').first()).toHaveAttribute(
      'href',
      'https://wa.me/201028838866'
    );
    await expect(page.locator('a[href="tel:+201028838866"]').first()).toBeVisible();

    // The mailbox stays unpublished until it can actually receive mail
    // (PHASE8_CONTENT_VALIDATION.md §A8). While EMAIL_PUBLISHED is false the
    // email card must be absent rather than show an address that bounces.
    const mailto = page.locator('a[href="mailto:info@travisiontours.com"]:visible');
    if (EMAIL_PUBLISHED) {
      await expect(mailto.first()).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Email' })).toBeVisible();
    } else {
      await expect(mailto).toHaveCount(0);
      await expect(page.getByRole('heading', { name: 'Email' })).toHaveCount(0);
    }

    await expect(page.getByRole('heading', { name: 'WhatsApp' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Telephone' })).toBeVisible();
  });

  test('the policies page states how payment works', async ({ page }) => {
    await open(page, '/policies');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Privacy, Booking');
    await expect(page.getByRole('heading', { name: 'Inquiry and confirmation' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Payment through our travel partner' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Changes and cancellations' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Privacy', exact: true })).toBeVisible();

    // The one business rule the site must never contradict.
    await expect(page.getByText(/does not collect payments or card details/i)).toBeVisible();
    await expect(page.getByText('Egypt Online Tour').first()).toBeVisible();
  });

  test('a tour page carries the same contact details as the contact page', async ({ page }) => {
    await open(page, '/tours/6-days-cairo-luxor-aswan');

    // Consistency matters more than the values here: a visitor who finds one
    // number on the tour page and another in the footer has no way to tell
    // which is real. Phase 8 confirmed every surface reads one constant; this
    // proves it on a rendered page.
    await expect(page.locator('a[href="tel:+201028838866"]').first()).toBeVisible();
    // Same §A8 hold as the contact page: while the mailbox is unpublished the
    // tour page must not display it either.
    const mailto = page.locator('a[href="mailto:info@travisiontours.com"]:visible');
    if (EMAIL_PUBLISHED) {
      await expect(mailto.first()).toBeVisible();
    } else {
      await expect(mailto).toHaveCount(0);
    }
    await expect(page.locator('a[href^="https://wa.me/201028838866"]:visible').first()).toBeVisible();
  });
});
