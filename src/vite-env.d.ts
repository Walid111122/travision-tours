/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public site origin used for canonical URLs and the sitemap. */
  readonly VITE_APP_URL?: string;
  /** Cloudflare Turnstile site key. Public by design; empty disables the widget. */
  readonly VITE_TURNSTILE_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
