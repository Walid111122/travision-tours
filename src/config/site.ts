/**
 * The canonical origin, injected at build time by `vite.config.ts`, which
 * resolves it through `scripts/site-url.mjs`. That resolver is the authority:
 * it rejects localhost outright and refuses to run a production build without a
 * real origin, so the fallback here is only a safety net and never the value
 * that reaches a published page.
 */
export const SITE_URL = (import.meta.env.VITE_APP_URL || 'https://travisiontours.com').replace(/\/$/, '');
export const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/hero.jpg`;
export const CONTACT_PHONE = '+201028838866';
export const CONTACT_PHONE_DISPLAY = '(+20) 102 883 8866';
export const CONTACT_EMAIL = 'info@travisiontours.com';

// Shared with the Worker — declared in ./business, which has no import.meta.env.
export { SITE_NAME, PAYMENT_PARTNER_NAME, INQUIRY_POLICY_VERSION, EMAIL_PUBLISHED } from './business';

export function absoluteUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
}
