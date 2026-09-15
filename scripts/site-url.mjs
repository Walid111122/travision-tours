/**
 * Resolve the canonical site URL for the build.
 *
 * Used by `vite.config.ts`, the sitemap generator and the prerenderer, so all
 * three agree on exactly one origin.
 *
 * Rules:
 *   - `SITE_URL` (or `VITE_APP_URL`) wins when set.
 *   - A localhost value is always an error: it can never belong in a canonical
 *     URL, a sitemap or an Open Graph tag.
 *   - When nothing is set, a production build (`PRODUCTION=1`) fails. This is
 *     what stops a launch from silently shipping canonical URLs pointing at a
 *     domain the owner does not control.
 *   - During Part A there is no domain yet, so a non-production build falls
 *     back to the placeholder with a loud warning.
 */

/** The intended production origin. Not a claim of ownership — just a default. */
export const PLACEHOLDER_SITE_URL = 'https://travisiontours.com';

const LOCAL_HOST = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?::\d+)?(\/|$)/i;

export function resolveSiteUrl(mode = 'production') {
  // Vite deliberately loads .env files only after evaluating vite.config.ts.
  // Build scripts also run outside Vite, so load the same mode-specific files
  // explicitly. Values already present in the process remain authoritative.
  const fileEnv = loadEnv(mode, process.cwd(), '');
  const raw = (
    process.env.SITE_URL ||
    process.env.VITE_APP_URL ||
    fileEnv.SITE_URL ||
    fileEnv.VITE_APP_URL ||
    ''
  ).trim();
  // Opt-in only. Deliberately not derived from NODE_ENV, which Vite sets during
  // any build — deriving it would make every local build fail.
  const production = process.env.PRODUCTION === '1';

  if (raw) {
    if (LOCAL_HOST.test(raw)) {
      throw new Error(
        `SITE_URL must not point at localhost ("${raw}"). Canonical URLs, the sitemap and ` +
          'Open Graph tags are published to search engines and social networks.'
      );
    }

    let parsed;
    try {
      parsed = new URL(raw);
    } catch {
      throw new Error(`SITE_URL is not a valid absolute URL: "${raw}"`);
    }

    if (parsed.protocol !== 'https:') {
      throw new Error(`SITE_URL must use https: — got "${raw}"`);
    }

    return raw.replace(/\/+$/, '');
  }

  if (production) {
    throw new Error(
      'No site URL configured. Set SITE_URL (for example SITE_URL=https://example.com) before ' +
        'building for production — see .env.example. Refusing to publish canonical URLs for a ' +
        'domain the owner does not control.'
    );
  }

  console.warn(
    `\n  ! SITE_URL is not set — falling back to ${PLACEHOLDER_SITE_URL} for this non-production build.\n` +
      '    Canonical URLs and the sitemap will use that origin. Set SITE_URL before any public\n' +
      '    deployment (see .env.example).\n'
  );

  return PLACEHOLDER_SITE_URL;
}
import { loadEnv } from 'vite';
