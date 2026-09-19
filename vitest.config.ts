import path from 'path';
import { defineConfig } from 'vitest/config';
import { resolveSiteUrl } from './scripts/site-url.mjs';

/**
 * Vitest configuration.
 *
 * Deliberately separate from `vite.config.ts` rather than extending it: the app
 * config pulls in the React and Tailwind plugins, and Tailwind's plugin scans
 * the whole source tree on startup, which is pure overhead for tests that run in
 * a Node environment and never render a component. Only the two things tests
 * genuinely need are repeated here.
 *
 * 1. `VITE_APP_URL`. `src/config/site.ts` reads `import.meta.env.VITE_APP_URL`,
 *    and the app config writes it from `resolveSiteUrl()` before Vite inlines
 *    it. Without this, `SITE_URL` would silently fall back to its placeholder
 *    and any assertion about canonical URLs would be testing the wrong origin.
 *    Vitest does provide `import.meta.env`, unlike a plain `tsx` script, so the
 *    value resolves normally once it is set.
 * 2. The `@` alias, so tests can import modules by the same specifier the app
 *    uses.
 */
const siteUrl = resolveSiteUrl();
process.env.VITE_APP_URL = siteUrl;

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.')
    }
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx', 'tests/worker/**/*.test.ts'],
    // Worker integration tests boot a real `wrangler dev` and apply migrations to
    // a disposable D1 before the first assertion, so the per-test default is far
    // too short. The hook timeout covers that one-off setup.
    testTimeout: 30_000,
    hookTimeout: 180_000,
    // The worker suite owns a fixed local port and a single D1 directory. Running
    // files in parallel would have them fight over both.
    fileParallelism: false,
    reporters: ['default']
  }
});
