import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {resolveSiteUrl} from './scripts/site-url.mjs';

export default defineConfig(({ isSsrBuild, mode }) => {
  // One authoritative origin for canonical URLs, Open Graph tags and the
  // sitemap. Vite only exposes VITE_-prefixed variables to the bundle, so the
  // resolved value is written into the environment rather than read from a
  // .env file that could disagree with the build scripts.
  const siteUrl = resolveSiteUrl(mode);
  process.env.VITE_APP_URL = siteUrl;

  return {
    plugins: [react(), tailwindcss()],
    // The SSR bundle is an intermediate artifact consumed by the prerenderer
    // and never deployed. Copying the multi-megabyte public/ directory into it
    // would waste time and disk on every build.
    publicDir: isSsrBuild ? false : 'public',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // File watching can be disabled in hosted development environments.
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': 'http://127.0.0.1:8787',
      },
    },
  };
});
