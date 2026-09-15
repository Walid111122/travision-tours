import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
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
 */
function browserTarget(): { channel?: 'chrome' } {
  const bundled = chromium.executablePath();
  if (bundled && existsSync(bundled)) return {};
  return { channel: 'chrome' };
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
