import { defineConfig, devices } from '@playwright/test';
import { existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { chromium } from '@playwright/test';

/**
 * Playwright configuration.
 *
 * The app is served by a real `wrangler dev` on a disposable local D1 (see
 * `tests/e2e/serve.mjs`) rather than by `vite preview`. That matters: the
 * booking form talks to the Worker API, so a static server would make the
 * submit path untestable and every assertion about it would be theatre.
 *
 * Port 8788 is used rather than the developer default 8787, so an already
 * running `npm run dev:worker` cannot be mistaken for the test server. A stale
 * dev server serving fresh HTML against an old asset manifest is a failure mode
 * that silently produces false passes.
 */

/**
 * Prefer the browser Playwright manages. If `npx playwright install` has not
 * been run — or the download is unavailable — fall back to the locally
 * installed Chrome via the `chrome` channel, so the suite still runs rather
 * than failing for an environment reason that has nothing to do with the app.
 *
 * The default headless binary can also exist on disk yet be unlaunchable —
 * e.g. a Windows Application Control / SmartScreen policy blocking
 * `chrome-headless-shell.exe`. `chromium.executablePath()` returns the full
 * chrome.exe while headless runs actually spawn the sibling
 * `chromium_headless_shell-*` build, so that binary — not the reported one —
 * is what must be probed. When it cannot run, use the full bundled Chromium
 * (`channel: 'chromium'`), whose new headless mode runs the same engine
 * through the unblocked chrome.exe.
 */
function browserTarget(): { channel?: 'chrome' | 'chromium' } {
  const bundled = chromium.executablePath();
  if (!bundled || !existsSync(bundled)) return { channel: 'chrome' };

  // bundled = ms-playwright/chromium-<rev>/chrome-win64/chrome.exe — the
  // registry root (sibling of chromium_headless_shell-<rev>) is three up.
  const registryDir = dirname(dirname(dirname(bundled)));
  const headlessShell = readdirSync(registryDir)
    .filter(d => d.startsWith('chromium_headless_shell-'))
    .map(d => join(registryDir, d, 'chrome-headless-shell-win64', 'chrome-headless-shell.exe'))
    .find(existsSync);

  if (headlessShell) {
    const probe = spawnSync(headlessShell, ['--version'], { timeout: 10_000 });
    if (probe.error || probe.status !== 0) return { channel: 'chromium' };
  }
  return {};
}

const PORT = Number(process.env.E2E_PORT ?? 8788);
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  // The suite writes real inquiries to one shared local D1 and the app keeps
  // planner state in localStorage. Serial execution keeps both deterministic.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off'
  },

  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, ...browserTarget() }
    },
    {
      name: 'mobile',
      // Use Chromium with iPhone viewport/touch emulation. The device preset
      // defaults to WebKit, which makes local and CI runs depend on a second
      // browser download without improving the responsive-layout coverage.
      use: { ...devices['iPhone 13'], browserName: 'chromium', ...browserTarget() }
    }
  ],

  webServer: {
    command: 'node tests/e2e/serve.mjs',
    url: `${BASE_URL}/api/health`,
    reuseExistingServer: false,
    timeout: 150_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: { E2E_PORT: String(PORT) }
  }
});
