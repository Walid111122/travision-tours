/**
 * Business facts shared by the browser bundle and the booking Worker.
 *
 * `site.ts` resolves the canonical origin through Vite's `import.meta.env`,
 * which does not exist inside workerd, so the Worker cannot import from it.
 * The values that must agree across both sides of the inquiry boundary are
 * declared here instead — the version the site displays to visitors is the
 * same constant the Worker writes into `bookings.inquiry_policy_version`, and
 * the partner named on the page is the same one named in the API response.
 */
export const SITE_NAME = 'Travision Tours';
export const PAYMENT_PARTNER_NAME = 'Egypt Online Tour';
export const INQUIRY_POLICY_VERSION = '2026-08-13';

/**
 * Display and quotation currency. The mother-company website publishes prices
 * and policy fees in US dollars, so USD is the current value everywhere —
 * centralized so a future decision changes one constant.
 */
export const DISPLAY_CURRENCY = 'USD';

/**
 * The `info@travisiontours.com` mailbox cannot receive mail until the domain
 * is registered and DNS/MX are configured. Per the launch plan
 * (PHASE8_CONTENT_VALIDATION.md §A8) the address must not be published while
 * undeliverable — every render of it is gated on this flag. Flip to `true`
 * once the owner confirms the mailbox is live; all seven sites restore at
 * once.
 */
export const EMAIL_PUBLISHED = false;
