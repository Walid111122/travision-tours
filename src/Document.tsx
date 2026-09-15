import React from 'react';

/**
 * The complete HTML document, rendered by React on the server.
 *
 * React 19 hoists `<title>`, `<meta>` and `<link>` tags rendered anywhere in the
 * tree into the document's `<head>` — but only when React is rendering the
 * document itself. Injecting app markup into an `index.html` template instead
 * left every page's title and meta description stranded inside `<body>`, which
 * is not where crawlers look for them.
 *
 * The static tags below mirror `index.html`, which remains the shell used by the
 * Vite dev server and the source of the client build's asset tags. `scripts/
 * prerender.ts` fails the build if the two drift apart.
 */

export type DocumentAssets = {
  /** Stylesheet hrefs emitted by the client build. */
  styles: string[];
  /** Module script srcs emitted by the client build. */
  scripts: string[];
};

type Props = DocumentAssets & {
  children: React.ReactNode;
};

export default function Document({ styles, scripts, children }: Props) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#0A0A0B" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/site.webmanifest" />
        {/*
          Self-hosted fonts. Only the two faces used above the fold are
          preloaded; everything else is fetched on demand via its unicode-range.
        */}
        <link rel="preload" href="/fonts/marcellus-400-latin.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/inter-400-latin.woff2" as="font" type="font/woff2" crossOrigin="" />
        {styles.map(href => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
      </head>
      <body>
        <div id="root">{children}</div>
        {scripts.map(src => (
          <script key={src} type="module" src={src} />
        ))}
      </body>
    </html>
  );
}
