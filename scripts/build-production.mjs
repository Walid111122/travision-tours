/**
 * Production build entry point.
 *
 *   npm run build:production
 *
 * Sets `PRODUCTION=1` and runs the normal build. The flag turns the site-URL
 * check in `scripts/site-url.mjs` from a warning into a hard failure, so a
 * launch can never publish canonical URLs pointing at a domain the owner does
 * not control.
 *
 * Exists as a script rather than an inline environment prefix because npm runs
 * scripts through cmd.exe on Windows, where `PRODUCTION=1 npm run build` is not
 * valid syntax.
 */

import { spawnSync } from 'node:child_process';
import { resolveSiteUrl } from './site-url.mjs';

process.env.PRODUCTION = '1';

let siteUrl;
try {
  siteUrl = resolveSiteUrl('production');
} catch (error) {
  console.error(`\n  ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const result = spawnSync(npmCommand, ['run', 'build'], {
  stdio: 'inherit',
  env: { ...process.env, SITE_URL: siteUrl, PRODUCTION: '1' }
});

process.exit(result.status ?? 1);
