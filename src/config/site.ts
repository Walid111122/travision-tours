export const SITE_URL = (import.meta.env.VITE_APP_URL || 'https://travisiontours.com').replace(/\/$/, '');
export const SITE_NAME = 'Travision Tours';
export const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/hero.jpg`;
export const CONTACT_PHONE = '+201004051515';
export const CONTACT_EMAIL = 'info@travisiontours.com';

export function absoluteUrl(pathOrUrl: string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
}
