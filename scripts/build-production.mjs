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

const npmCli = process.env.npm_execpath;
if (!npmCli) {
  console.error('\n  npm_execpath is unavailable; run this script through `npm run build:production`.\n');
  process.exit(1);
}

// Invoking npm.cmd directly with spawnSync can fail without an actionable
// error on locked-down Windows hosts. Running npm's JavaScript entry point
// through the current Node executable is portable and preserves stdio.
const result = spawnSync(process.execPath, [npmCli, 'run', 'build'], {
  stdio: 'inherit',
  env: { ...process.env, SITE_URL: siteUrl, PRODUCTION: '1' }
});

if (result.error) {
  console.error(`\n  Production build could not start: ${result.error.message}\n`);
}

process.exit(result.status ?? 1);
