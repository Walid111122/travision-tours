/**
 * Prerender entry — used only by `scripts/prerender.ts`, never shipped.
 *
 * Renders the same `AppShell` the browser renders, but inside a `StaticRouter`
 * so a fixed location can be rendered to a string, and wrapped in a `Document`
 * so React owns the `<head>` and can hoist each route's title and meta tags
 * into it.
 *
 * React's streaming renderer is used rather than `renderToString` because the
 * route components are `React.lazy`: streaming waits for them via `onAllReady`,
 * whereas `renderToString` would bail out on the first unresolved Suspense
 * boundary.
 */

import React from 'react';
import { Writable } from 'node:stream';
import { renderToPipeableStream } from 'react-dom/server';
import { HelmetProvider } from 'react-helmet-async';
import { StaticRouter } from 'react-router-dom';
import AppShell, { type PageComponents } from './AppShell';
import Document, { type DocumentAssets } from './Document';

import Home from './pages/Home';
import Tours from './pages/Tours';
import TourDetails from './pages/TourDetails';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import ItineraryBuilder from './pages/ItineraryBuilder';
import Guidelines from './pages/Guidelines';
import Policies from './pages/Policies';
import About from './pages/About';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';

/**
 * Pages imported eagerly, so nothing suspends while prerendering.
 *
 * `PageComponents` is a closed record, so adding a route without adding it here
 * is a compile error rather than a silently missing page.
 */
const eagerPages: PageComponents = {
  Home,
  Tours,
  TourDetails,
  Blog,
  BlogPost,
  ItineraryBuilder,
  Guidelines,
  Policies,
  About,
  Contact,
  Admin,
  NotFound
};

/** How long a single route may take before the render is abandoned. */
const RENDER_TIMEOUT_MS = 20_000;

export type RenderResult = {
  /** The complete HTML document. */
  document: string;
  /** True when the router fell through to the catch-all NotFound route. */
  notFound: boolean;
};

export async function render(url: string, assets: DocumentAssets): Promise<RenderResult> {
  const html = await new Promise<string>((resolve, reject) => {
    let output = '';
    let settled = false;

    const sink = new Writable({
      write(chunk, _encoding, callback) {
        output += chunk.toString();
        callback();
      }
    });

    sink.on('finish', () => {
      if (!settled) {
        settled = true;
        resolve(output);
      }
    });

    const { pipe, abort } = renderToPipeableStream(
      <HelmetProvider>
        <StaticRouter location={url}>
          <Document styles={assets.styles} scripts={assets.scripts}>
            <AppShell pages={eagerPages} />
          </Document>
        </StaticRouter>
      </HelmetProvider>,
      {
        /**
         * React's streaming renderer "outlines" a Suspense boundary once its
         * content passes ~12.8 kB: instead of the page it emits a `<template>`
         * plus a `hidden` div, which only an inline `$RC` script can reveal.
         * That would hide every page behind JavaScript and demand a CSP
         * exception for the inline script.
         *
         * Every page is supplied eagerly here, so nothing can suspend and the
         * boundary always completes in the first pass. Raising the threshold to
         * Infinity makes React inline it and emit the page as ordinary markup.
         * The browser entry resolves the same route's chunk before hydrating,
         * so its first render is synchronous too and the two sides still agree.
         */
        progressiveChunkSize: Infinity,
        onAllReady() {
          pipe(sink);
        },
        onShellError(error) {
          if (!settled) {
            settled = true;
            reject(error);
          }
        },
        onError(error) {
          // Non-fatal: React recovered by client-rendering this boundary. The
          // prerenderer surfaces the message so it is not lost silently.
          console.error(`  ! render warning at ${url}:`, (error as Error)?.message ?? error);
        }
      }
    );

    const timer = setTimeout(() => {
      abort();
      if (!settled) {
        settled = true;
        reject(new Error(`Prerender timed out after ${RENDER_TIMEOUT_MS}ms for ${url}`));
      }
    }, RENDER_TIMEOUT_MS);

    sink.on('close', () => clearTimeout(timer));
  });

  // The NotFound page always declares "Page Not Found" as its title; that is a
  // reliable marker for "this URL is not a real route".
  const notFound = html.includes('<title>Page Not Found');

  return { document: html, notFound };
}
