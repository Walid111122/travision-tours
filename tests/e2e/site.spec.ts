import { expect, test } from '@playwright/test';
import { EMAIL_PUBLISHED } from '../../src/config/business';
import { BLOG_POSTS } from '../../src/blogPosts';
import { open, openWithoutHydration } from './helpers';

/**
 * Plan Phase 9, browser flows 12–14:
 *
 *  12. Blog article flow if Blog remains public.
 *  13. Unknown page and unknown tour 404.
 *  14. Policies, contact, WhatsApp, and email links.
 */

test.describe('12. Blog is published with real articles', () => {
  /**
   * The blog went public once owner-approved articles existed: it is now
   * indexable, linked in navigation and the footer, and listed in the sitemap.
   * Every post renders its own prerendered document at /blog/:id.
   */
  test('the listing renders every published article', async ({ page }) => {
    const response = await open(page, '/blog');

    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Cultural');
    await expect(page.locator('article')).toHaveCount(BLOG_POSTS.length);

    // Still no newsletter form — no provider or privacy wording is approved.
    await expect(page.getByRole('textbox')).toHaveCount(0);
  });

  test('an article page renders with an indexable canonical and Article JSON-LD', async ({ page }) => {
    const post = BLOG_POSTS[0];
    const response = await open(page, `/blog/${post.id}`);

    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(post.title);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /index, follow/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `https://travisiontours.com/blog/${post.id}`
    );

    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(jsonLd.some(s => s.includes('"@type":"Article"'))).toBe(true);
  });

  test('an unknown article answers with the not-found page', async ({ page }) => {
    await open(page, '/blog/not-a-real-article');
    await expect(page.getByText(/404/)).toBeVisible();
  });

  test('the page is indexable and linked from navigation', async ({ page }) => {
    await open(page, '/blog');

    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /index, follow/);
    // The header links to /blog via the desktop nav bar or the mobile drawer —
    // the drawer mounts only while open, so open it when the button exists.
    const menuButton = page.getByRole('button', { name: /navigation menu/i });
    if (await menuButton.isVisible()) await menuButton.click();
    await expect(page.getByRole('link', { name: 'Blog', exact: true }).first()).toBeVisible();
  });

  test('the sitemap lists it and robots.txt no longer disallows it', async ({ page }) => {
    const sitemap = await (await page.request.get('/sitemap.xml')).text();
    expect(sitemap).toContain('/blog');
    expect(sitemap).toContain(`/blog/${BLOG_POSTS[0].id}`);

    const robots = await (await page.request.get('/robots.txt')).text();
    expect(robots).not.toContain('Disallow: /blog');
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
