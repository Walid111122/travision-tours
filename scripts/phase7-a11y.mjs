#!/usr/bin/env node
/**
 * Phase 7 — accessibility checks.
 *
 * Two independent passes:
 *
 *   A. Structural assertions over the prerendered HTML in `dist/`, parsed as
 *      real DOM with cheerio. Catches the things that matter most to assistive
 *      technology — controls with no accessible name, images with no alt text,
 *      duplicate ids, a missing or duplicated <h1>, missing landmarks — plus a
 *      handful of source-level assertions for behaviour that is not in the
 *      initial HTML (the dialogs, the accordion, the mobile menu).
 *
 *   B. axe-core run inside headless Chrome, driven over the DevTools Protocol,
 *      against the routes served by `wrangler dev`. This is the only pass that
 *      sees computed styles, so it is the one that can judge colour contrast and
 *      real focus behaviour. Skipped with an explanatory message when no dev
 *      server is listening.
 *
 * Requires `npm run build` first. For pass B also run `npm run dev:worker`.
 *
 *   node scripts/phase7-a11y.mjs
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const DEV_ORIGIN = process.env.DEV_ORIGIN || 'http://127.0.0.1:8787';

let passed = 0;
let failed = 0;
const failures = [];

function section(name) {
  console.log(`\n=== ${name} ===`);
}

function check(label, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    failures.push(label);
    console.log(`  FAIL  ${label}${detail ? `\n        ${detail}` : ''}`);
  }
}

function readSource(relative) {
  const full = path.join(ROOT, relative);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
}

/* ------------------------------------------------------------------ *
 * Accessible-name approximation
 *
 * Mirrors the first applicable step of the accname algorithm: aria-labelledby,
 * then aria-label, then a <label>, then the element's own text, then title.
 * Good enough to catch a control that has no name at all, which is the failure
 * that actually blocks a screen-reader user.
 * ------------------------------------------------------------------ */

function accessibleName($, element) {
  const node = $(element);
  const text = value => (value || '').replace(/\s+/g, ' ').trim();

  const labelledBy = node.attr('aria-labelledby');
  if (labelledBy) {
    const joined = labelledBy
      .split(/\s+/)
      .map(id => text($(`#${CSS_escape(id)}`).text()))
      .filter(Boolean)
      .join(' ');
    if (joined) return joined;
  }

  const ariaLabel = text(node.attr('aria-label'));
  if (ariaLabel) return ariaLabel;

  const id = node.attr('id');
  if (id) {
    const explicit = $(`label[for="${id.replace(/"/g, '\\"')}"]`);
    if (explicit.length) {
      const value = text(explicit.first().text());
      if (value) return value;
    }
  }

  const wrappingLabel = node.closest('label');
  if (wrappingLabel.length) {
    // Exclude the control's own text so a checkbox does not name itself.
    const clone = wrappingLabel.clone();
    clone.find('input, select, textarea, button').remove();
    const value = text(clone.text());
    if (value) return value;
  }

  if (node.is('input[type="image"]')) return text(node.attr('alt'));
  if (node.is('input[type="submit"], input[type="button"], input[type="reset"]')) {
    return text(node.attr('value'));
  }

  const own = text(node.text());
  if (own) return own;

  return text(node.attr('title'));
}

/** CSS.escape is not available in Node, and ids here are simple. */
function CSS_escape(value) {
  return value.replace(/([^\w-])/g, '\\$1');
}

/**
 * True when `needle` sits inside a `@layer { … }` block.
 *
 * Tailwind v4 orders its layers so that anything layered loses to anything
 * unlayered, regardless of specificity. The focus rule therefore has to sit
 * outside every layer to beat `focus:outline-none`, and a plain "does the file
 * mention @layer" test cannot tell the difference — it matches a layer block
 * that closed earlier in the file. This walks the braces instead.
 */
function isInsideLayer(css, needle) {
  const index = css.indexOf(needle);
  if (index === -1) return null;

  const stack = [];
  for (let i = 0; i < index; i += 1) {
    const char = css[i];
    if (char === '{') {
      // The statement text between the previous terminator and this brace.
      let start = i - 1;
      while (start >= 0 && !';{}'.includes(css[start])) start -= 1;
      stack.push(/@layer\b/.test(css.slice(start + 1, i)));
    } else if (char === '}') {
      stack.pop();
    }
  }
  return stack.some(Boolean);
}

/* ------------------------------------------------------------------ *
 * Pass A — prerendered HTML
 * ------------------------------------------------------------------ */

function documentPaths() {
  const found = [];
  const walk = dir => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.html')) found.push(full);
    }
  };
  walk(DIST);
  return found.sort();
}

function runDocumentChecks() {
  const documents = documentPaths();
  section('Prerendered documents');
  check('at least one document was prerendered', documents.length > 0, `found ${documents.length}`);

  const problems = {
    noName: [],
    noAlt: [],
    duplicateIds: [],
    headingCount: [],
    noLang: [],
    noLandmark: [],
    noSkipLink: []
  };

  for (const file of documents) {
    const relative = path.relative(DIST, file).split(path.sep).join('/');
    const $ = cheerio.load(readFileSync(file, 'utf8'));

    if (!$('html').attr('lang')) problems.noLang.push(relative);

    const h1Count = $('h1').length;
    if (h1Count !== 1) problems.headingCount.push(`${relative} (${h1Count})`);

    if ($('main').length === 0 || $('footer').length === 0 || $('nav').length === 0) {
      problems.noLandmark.push(relative);
    }

    if ($('a[href="#main-content"]').length === 0) problems.noSkipLink.push(relative);

    // Duplicate ids break every id-based association on the page.
    const seen = new Set();
    const duplicates = new Set();
    $('[id]').each((_, el) => {
      const id = $(el).attr('id');
      if (seen.has(id)) duplicates.add(id);
      seen.add(id);
    });
    if (duplicates.size) problems.duplicateIds.push(`${relative} → ${[...duplicates].join(', ')}`);

    // Every interactive control needs an accessible name.
    $('button, a[href], input:not([type="hidden"]), select, textarea').each((_, el) => {
      const node = $(el);
      if (node.attr('aria-hidden') === 'true') return;
      if (!accessibleName($, el)) {
        const tag = el.tagName;
        const type = node.attr('type') ? `[type=${node.attr('type')}]` : '';
        problems.noName.push(`${relative} → <${tag}${type}>`);
      }
    });

    $('img').each((_, el) => {
      const node = $(el);
      if (node.attr('aria-hidden') === 'true') return;
      // An empty alt is the correct way to mark a decorative image, so only a
      // *missing* alt attribute is a problem.
      if (node.attr('alt') === undefined) {
        problems.noAlt.push(`${relative} → ${node.attr('src')}`);
      }
    });
  }

  check(
    'every document declares a language',
    problems.noLang.length === 0,
    problems.noLang.join(', ')
  );
  check(
    'every document has exactly one <h1>',
    problems.headingCount.length === 0,
    problems.headingCount.join(', ')
  );
  check(
    'every document has nav, main and footer landmarks',
    problems.noLandmark.length === 0,
    problems.noLandmark.join(', ')
  );
  check(
    'every document offers a skip-to-content link',
    problems.noSkipLink.length === 0,
    problems.noSkipLink.slice(0, 5).join(', ')
  );
  check(
    'no document contains duplicate element ids',
    problems.duplicateIds.length === 0,
    problems.duplicateIds.slice(0, 5).join('\n        ')
  );
  check(
    'every button, link and form control has an accessible name',
    problems.noName.length === 0,
    `${problems.noName.length} unnamed control(s):\n        ${problems.noName.slice(0, 12).join('\n        ')}`
  );
  check(
    'every image carries an alt attribute',
    problems.noAlt.length === 0,
    problems.noAlt.slice(0, 8).join('\n        ')
  );
}

/* ------------------------------------------------------------------ *
 * Pass A — source-level assertions
 *
 * Behaviour that is not present in the initial HTML: dialogs, the accordion,
 * the mobile menu, and the keyboard reordering controls.
 * ------------------------------------------------------------------ */

function runSourceChecks() {
  section('Source structure');

  const navbar = readSource('src/components/Navbar.tsx');
  check(
    'the mobile menu button exposes its state and target',
    /aria-expanded=\{isOpen\}/.test(navbar) &&
      /aria-controls="mobile-navigation"/.test(navbar) &&
      /aria-label=\{isOpen \?/.test(navbar),
    'expected aria-label, aria-expanded and aria-controls on the toggle'
  );
  check(
    'the mobile menu panel has the id the button points at',
    /id="mobile-navigation"/.test(navbar)
  );

  const accordion = readSource('src/components/ItineraryAccordion.tsx');
  check(
    'the itinerary accordion button exposes expanded state and its panel',
    /aria-expanded=\{isOpen\}/.test(accordion) && /aria-controls=\{panelId\}/.test(accordion),
    'expected aria-expanded and aria-controls on the toggle button'
  );
  check(
    'the itinerary accordion panel is a labelled region',
    /role="region"/.test(accordion) && /aria-labelledby=\{headerId\}/.test(accordion)
  );

  const modal = readSource('src/components/Modal.tsx');
  check('the dialog exposes role="dialog"', /role="dialog"/.test(modal));
  check('the dialog is marked modal', /aria-modal="true"/.test(modal));
  check('the dialog is named by its heading', /aria-labelledby=\{titleId\}/.test(modal));
  check('Escape closes the dialog', /event\.key === 'Escape'/.test(modal));
  check(
    'focus is trapped inside the dialog',
    /event\.key !== 'Tab'/.test(modal) && /panel\.contains\(document\.activeElement\)/.test(modal),
    'expected a Tab handler that keeps focus inside the panel'
  );
  check(
    'focus returns to the trigger when the dialog closes',
    /restoreRef\.current\?\.focus\?\.\(\)/.test(modal)
  );
  check(
    'the dialog moves focus in when it opens',
    /panel\?\.querySelector<HTMLElement>/.test(modal)
  );

  const planner = readSource('src/pages/ItineraryBuilder.tsx');
  check(
    'the planner uses the shared accessible dialog for both modals',
    (planner.match(/<Modal/g) || []).length === 2,
    `found ${(planner.match(/<Modal/g) || []).length} <Modal> usages`
  );
  check(
    'the itinerary can be reordered without a pointer',
    /moveStop\(index, -1\)/.test(planner) && /moveStop\(index, 1\)/.test(planner),
    'expected move-earlier / move-later buttons'
  );
  check(
    'the reorder and remove buttons are named',
    /aria-label=\{`Move \$\{item\.title\} earlier/.test(planner) &&
      /aria-label=\{`Move \$\{item\.title\} later/.test(planner) &&
      /aria-label=\{`Remove \$\{item\.title\}/.test(planner)
  );
  check(
    'the region filter pills are grouped and expose pressed state',
    /role="group"/.test(planner) && /aria-pressed=\{filterRegion === region\.id\}/.test(planner)
  );

  const tours = readSource('src/pages/Tours.tsx');
  check(
    'the tours search field is labelled',
    /htmlFor="tour-search"/.test(tours) && /id="tour-search"/.test(tours)
  );
  check(
    'the price range control is labelled and announces its value',
    /aria-label="Maximum price per person"/.test(tours) && /aria-valuetext=/.test(tours)
  );
  check(
    'the filter drawer exposes its expanded state',
    /aria-expanded=\{isFilterOpen\}/.test(tours) && /id="tour-filters"/.test(tours)
  );
  check(
    'the view-mode toggles are named and expose pressed state',
    /aria-label="Grid view"/.test(tours) &&
      /aria-label="List view"/.test(tours) &&
      /aria-pressed=\{viewMode === 'grid'\}/.test(tours)
  );
  const pressedCount = (tours.match(/aria-pressed=/g) || []).length;
  check(
    'every toggle-style filter reports aria-pressed',
    pressedCount >= 6,
    `found ${pressedCount} aria-pressed attributes`
  );

  const details = readSource('src/pages/TourDetails.tsx');
  check(
    'the section navigation reports the current section',
    /aria-current=\{activeTab === tab\.id/.test(details) && /aria-label="Tour sections"/.test(details)
  );
  check(
    'the booking error is announced and focusable',
    /role="alert"/.test(details) && /bookingErrorRef/.test(details) && /tabIndex=\{-1\}/.test(details)
  );

  const shell = readSource('src/AppShell.tsx');
  check('the app renders a skip link', /Skip to main content/.test(shell));
  check('the main landmark is the skip target', /id="main-content"/.test(shell));
  check(
    'JS-driven animation honours reduced motion',
    /MotionConfig reducedMotion="user"/.test(shell),
    'expected <MotionConfig reducedMotion="user">'
  );

  section('Focus and motion');

  const css = readSource('src/index.css');
  check(
    'a visible :focus-visible outline is defined',
    /:focus-visible\s*\{[^}]*outline:\s*3px solid/.test(css),
    'expected an :focus-visible rule with an outline'
  );
  check(
    'the focus rule is not inside a @layer (it must beat the utility layer)',
    isInsideLayer(css, ':focus-visible') === false,
    isInsideLayer(css, ':focus-visible') === null
      ? 'no :focus-visible rule found'
      : 'the :focus-visible rule is inside a @layer and will lose to focus:outline-none'
  );
  check('reduced motion is handled in CSS', /prefers-reduced-motion: reduce/.test(css));

  // The rule must survive the build, not just exist in the source.
  const builtCss = readdirSync(path.join(DIST, 'assets'))
    .filter(name => name.endsWith('.css'))
    .map(name => readFileSync(path.join(DIST, 'assets', name), 'utf8'))
    .join('\n');
  check(
    'the focus outline survives into the built stylesheet',
    /:focus-visible\s*\{[^}]*outline:\s*3px solid/.test(builtCss),
    'the built CSS does not contain the :focus-visible outline rule'
  );

  check(
    'a reduced-motion-aware scroll helper exists',
    /export function scrollToElement/.test(readSource('src/utils/motion.ts'))
  );

  // Smooth scrolling that bypasses the helper would ignore reduced motion.
  const offenders = [];
  for (const dir of ['src/pages', 'src/components']) {
    for (const entry of readdirSync(path.join(ROOT, dir))) {
      const source = readSource(path.join(dir, entry));
      if (/behavior: 'smooth'|scrollIntoView\(/.test(source)) offenders.push(`${dir}/${entry}`);
    }
  }
  check(
    'no page scrolls smoothly outside the reduced-motion helper',
    offenders.length === 0,
    offenders.join(', ')
  );
}

/* ------------------------------------------------------------------ *
 * Pass B — axe-core in headless Chrome over the DevTools Protocol
 * ------------------------------------------------------------------ */

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium'
];

const ROUTES = [
  '/',
  '/tours',
  '/tours?type=daytours',
  '/tours?type=shore',
  '/tours/cairo-day-tour',
  // A multi-day tour, so the itinerary accordion is actually present: single-day
  // tours render one entry through the noAccordion branch and have no toggle.
  '/tours/6-days-cairo-luxor-aswan',
  '/blog',
  '/blog/visiting-pyramids-of-giza-first-time-guide',
  '/planner',
  '/about',
  '/contact',
  '/guidelines',
  '/policies',
  '/this-route-does-not-exist'
];

const SERIOUS = new Set(['serious', 'critical']);

class Cdp {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.waiting = new Map();
    socket.onmessage = event => this.dispatch(JSON.parse(event.data));
  }

  dispatch(message) {
    if (message.id && this.pending.has(message.id)) {
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }
    const queue = this.waiting.get(message.method);
    if (queue && queue.length) queue.shift()(message.params);
  }

  send(method, params = {}) {
    const id = this.nextId++;
    this.socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }

  once(method) {
    return new Promise(resolve => {
      const queue = this.waiting.get(method) || [];
      queue.push(resolve);
      this.waiting.set(method, queue);
    });
  }
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/** WCAG relative luminance of an sRGB pixel, channels 0-255. */
function relativeLuminance(r, g, b) {
  const channel = value => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two relative luminances. */
function contrastRatioFromLuminance(a, b) {
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Resolves the nodes axe leaves as `color-contrast` *incomplete*.
 *
 * axe declines to judge text whose background is not a single flat colour: a
 * gradient, a photograph, or a decorative overlay. That is honest of it, but
 * "undetermined" is not "fine" — so rather than report an unexplained gap, we
 * resolve each node to an actual ratio and assert on that.
 *
 * The model is the part that is easy to get wrong. Walking outward from the
 * text, the first *fully opaque* background is the base, and anything below it
 * is hidden and must not be considered — including it pairs dark text with the
 * dark page root and invents failures that do not exist. Translucent layers
 * seen before the base composite on top of it, outermost first; a gradient
 * contributes one base per colour stop and the worst stop decides.
 *
 * Two paint cases go beyond plain `color`: SVG text is painted by `fill`, and
 * gradient-clipped text by its own background gradient.
 *
 * Colours are converted by painting a pixel and reading it back, because
 * Chrome hands back the oklab() form verbatim for Tailwind v4's colour-mix
 * utilities (text-egypt-papyrus/70 computes to oklab(0.962 0.001 0.007 / 0.7)),
 * which no rgb()/hex regex matches.
 *
 * Runs in the page, so it is a string. Note the doubled backslashes: this is
 * itself inside a template literal.
 */
const CONTRAST_RESOLVER = `(() => {
  const canvas = document.createElement('canvas');
  canvas.width = 1; canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const WHITE = { r: 255, g: 255, b: 255, a: 1 };

  function parseColor(input) {
    if (!input) return null;
    let s = String(input).trim();
    if (!s || s === 'none' || s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };

    let alpha = 1;
    const rgba = s.match(/^rgba\\(\\s*([^,]+),\\s*([^,]+),\\s*([^,]+),\\s*([^)]+)\\)$/i);
    if (rgba) {
      alpha = parseFloat(rgba[4]);
      s = 'rgb(' + rgba[1] + ',' + rgba[2] + ',' + rgba[3] + ')';
    } else {
      const slash = s.match(/\\/\\s*([0-9.]+%?)\\s*\\)\\s*$/);
      if (slash) {
        alpha = slash[1].endsWith('%') ? parseFloat(slash[1]) / 100 : parseFloat(slash[1]);
        s = s.slice(0, slash.index) + ')';
      }
      const hexA = s.match(/^#([0-9a-fA-F]{4}|[0-9a-fA-F]{8})$/);
      if (hexA) {
        const h = hexA[1];
        if (h.length === 8) { alpha = parseInt(h.slice(6, 8), 16) / 255; s = '#' + h.slice(0, 6); }
        else { alpha = parseInt(h[3] + h[3], 16) / 255; s = '#' + h.slice(0, 3); }
      }
    }
    if (!(alpha >= 0)) alpha = 1;

    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#123456';
    ctx.fillStyle = s;
    if (ctx.fillStyle === '#123456' && !/^(#|rgb)/i.test(s)) return null;
    ctx.fillRect(0, 0, 1, 1);
    const px = ctx.getImageData(0, 0, 1, 1).data;
    return { r: px[0], g: px[1], b: px[2], a: alpha };
  }

  function gradientStops(image) {
    const out = [];
    const re = /(rgba?\\([^)]*\\)|oklab\\([^)]*\\)|oklch\\([^)]*\\)|color\\([^)]*\\)|#[0-9a-fA-F]{3,8})/g;
    let m;
    while ((m = re.exec(image)) !== null) {
      const c = parseColor(m[1]);
      if (c) out.push(c);
    }
    return out;
  }

  function composite(fg, bg) {
    const a = fg.a + bg.a * (1 - fg.a);
    if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
    return {
      r: (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a,
      g: (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a,
      b: (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a,
      a
    };
  }
  function ch(v) { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); }
  function lum(c) { return 0.2126 * ch(c.r) + 0.7152 * ch(c.g) + 0.0722 * ch(c.b); }
  function ratio(a, b) { const la = lum(a), lb = lum(b); const hi = Math.max(la, lb), lo = Math.min(la, lb); return (hi + 0.05) / (lo + 0.05); }
  function rgb(c) { return 'rgb(' + Math.round(c.r) + ',' + Math.round(c.g) + ',' + Math.round(c.b) + ')' + (c.a < 0.999 ? '/' + c.a.toFixed(2) : ''); }

  return function resolve(selector) {
    const el = document.querySelector(selector);
    if (!el) return JSON.stringify({ missing: true });
    const cs = getComputedStyle(el);
    const isSvg = el.namespaceURI && el.namespaceURI.indexOf('svg') !== -1;

    // Decorative text — a watermark, an ornament — is exempt from the contrast
    // requirement (WCAG 1.4.3 covers text, and incidental decoration is out of
    // scope). Report it rather than failing it.
    const decorative = !!el.closest('[aria-hidden="true"]');

    let textColors = [];
    let paintVia = 'color';
    const fillColor = parseColor(cs.webkitTextFillColor);
    const clip = (cs.webkitBackgroundClip || cs.backgroundClip || '').indexOf('text') !== -1;
    if (isSvg) {
      const f = parseColor(cs.fill);
      if (f && f.a > 0) { textColors = [f]; paintVia = 'svg fill'; }
    }
    if (textColors.length === 0 && clip && cs.backgroundImage && cs.backgroundImage.indexOf('gradient') !== -1) {
      const stops = gradientStops(cs.backgroundImage).filter(c => c.a > 0);
      if (stops.length) { textColors = stops; paintVia = 'background-clip:text'; }
    }
    if (textColors.length === 0) {
      if (fillColor && fillColor.a > 0) textColors = [fillColor];
      else { const c = parseColor(cs.color); if (c && c.a > 0) textColors = [c]; }
    }
    if (textColors.length === 0) return JSON.stringify({ error: 'no visible text paint' });

    const translucent = [];
    let bases = null;
    const images = [];
    let sawImage = false;
    // Set when the effective background depends on something CSS does not
    // expose — a url() layer, or a translucent gradient stop with an unknown
    // layer beneath it (commonly an <img> positioned behind, as in the tour
    // banner where the photograph is an element, not a background-image).
    let uncertainBase = false;
    let cur = el, depth = 0;
    while (cur && depth < 15) {
      const s = getComputedStyle(cur);
      const bi = s.backgroundImage;
      if (bi && bi !== 'none') {
        if (bi.indexOf('url(') !== -1) {
          images.push('image');
          sawImage = true;
        }
        if (bi.indexOf('gradient') !== -1) {
          const stops = gradientStops(bi).filter(c => c.a > 0);
          if (stops.length) {
            // A translucent stop lets the layer beneath show through, so
            // compositing it against white is a guess rather than a fact.
            if (stops.some(c => c.a < 0.999)) uncertainBase = true;
            bases = stops.map(c => composite(c, WHITE));
            images.push('gradient');
            break;
          }
        }
      }
      const bg = parseColor(s.backgroundColor);
      if (bg && bg.a > 0) {
        if (bg.a >= 0.999) { bases = [bg]; break; }
        translucent.push(bg);
      }
      if (cur === document.documentElement) break;
      cur = cur.parentElement;
      depth += 1;
    }
    if (!bases) bases = [WHITE];

    let worst = null;
    for (const base of bases) {
      let eff = base;
      for (let i = translucent.length - 1; i >= 0; i -= 1) eff = composite(translucent[i], eff);
      for (const tc of textColors) {
        const text = composite(tc, eff);
        const r = ratio(text, eff);
        if (!worst || r < worst.ratio) worst = { ratio: r, background: eff, text };
      }
    }

    const fontSize = parseFloat(cs.fontSize);
    const bold = parseInt(cs.fontWeight, 10) >= 700;
    const large = fontSize >= 24 || (bold && fontSize >= 18.66);
    const required = large ? 3 : 4.5;

    return JSON.stringify({
      decorative,
      paintVia,
      fontSize,
      required,
      ratio: Math.round(worst.ratio * 100) / 100,
      passes: worst.ratio >= required,
      background: rgb(worst.background),
      compositedText: rgb(worst.text),
      images,
      // True when the analytic answer cannot be trusted, because the effective
      // background depends on a layer CSS does not reveal — a url() image, or a
      // translucent gradient over something unknown. The caller measures the
      // rendered pixels instead of believing the ratio reported above.
      unresolvedBase: sawImage || uncertainBase
    });
  };
})()`;

/**
 * Measure contrast from rendered pixels, for text whose background cannot be
 * resolved from CSS — in practice, text over a photograph.
 *
 * The element's box is captured twice: as rendered, then again with only the
 * glyph paint hidden, which leaves every background layer in place and yields
 * the true background. The glyph colour is recovered from the rendered image as
 * the pixel furthest in luminance from the background median, so there is no
 * need to parse whatever colour syntax the stylesheet used. Contrast is then
 * the worst case over every background pixel — the strictest reading, and the
 * one a reader can actually hit.
 */
async function measureContrastByPixels(cdp, selector) {
  const meta = await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return JSON.stringify({ missing: true });
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return JSON.stringify({
        fontSize: parseFloat(cs.fontSize),
        bold: parseInt(cs.fontWeight, 10) >= 700,
        rect: { x: r.left + window.scrollX, y: r.top + window.scrollY, w: r.width, h: r.height }
      });
    })()`,
    returnByValue: true
  });
  const info = JSON.parse(meta.result.value);
  if (info.missing || info.rect.w < 2 || info.rect.h < 2) return null;

  const clip = { x: info.rect.x, y: info.rect.y, width: info.rect.w, height: info.rect.h, scale: 1 };
  const withText = await cdp.send('Page.captureScreenshot', { format: 'png', clip, captureBeyondViewport: true });

  await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      el.dataset.p7contrast = [el.style.color, el.style.webkitTextFillColor, el.style.backgroundImage].join('\\u0000');
      el.style.color = 'transparent';
      el.style.webkitTextFillColor = 'transparent';
      el.style.backgroundImage = 'none';
    })()`
  });
  await delay(120);
  const background = await cdp.send('Page.captureScreenshot', { format: 'png', clip, captureBeyondViewport: true });
  await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      const parts = (el.dataset.p7contrast || '').split('\\u0000');
      el.style.color = parts[0] || '';
      el.style.webkitTextFillColor = parts[1] || '';
      el.style.backgroundImage = parts[2] || '';
    })()`
  });

  const bg = await sharp(Buffer.from(background.data, 'base64')).raw().toBuffer({ resolveWithObject: true });
  const fg = await sharp(Buffer.from(withText.data, 'base64')).raw().toBuffer({ resolveWithObject: true });
  const channels = bg.info.channels;

  const bgLums = [];
  for (let i = 0; i < bg.info.width * bg.info.height; i += 1) {
    bgLums.push(relativeLuminance(bg.data[i * channels], bg.data[i * channels + 1], bg.data[i * channels + 2]));
  }
  const sortedBg = [...bgLums].sort((a, b) => a - b);
  const median = sortedBg[Math.floor(sortedBg.length / 2)];

  let glyph = null;
  let spread = 0;
  for (let i = 0; i < fg.info.width * fg.info.height; i += 1) {
    const r = fg.data[i * channels];
    const g = fg.data[i * channels + 1];
    const b = fg.data[i * channels + 2];
    const distance = Math.abs(relativeLuminance(r, g, b) - median);
    if (distance > spread) { spread = distance; glyph = { r, g, b }; }
  }
  // If nothing stands out from the background there is no glyph paint to
  // measure — treat that as nothing to check rather than inventing a number.
  if (!glyph || spread < 0.02) return null;

  const glyphLum = relativeLuminance(glyph.r, glyph.g, glyph.b);
  let worst = Infinity;
  for (const l of bgLums) worst = Math.min(worst, contrastRatioFromLuminance(glyphLum, l));

  const large = info.fontSize >= 24 || (info.bold && info.fontSize >= 18.66);
  return {
    ratio: Math.round(worst * 100) / 100,
    required: large ? 3 : 4.5,
    glyph: `rgb(${glyph.r},${glyph.g},${glyph.b})`
  };
}

/**
 * Wait until nothing is still animating.
 *
 * The tour cards animate in with a staggered `opacity: 0 → 1` (up to ~1.8s for
 * a 22-card list). Measuring during that window samples washed-out colours and
 * reports contrast failures that do not exist once the page has settled — the
 * giveaway is a ratio that decreases monotonically down the list, tracking the
 * stagger delay rather than anything in the design.
 */
async function waitForAnimations(cdp, budgetMs = 8000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < budgetMs) {
    const probe = await cdp.send('Runtime.evaluate', {
      expression: 'document.getAnimations().filter(a => a.playState === "running").length',
      returnByValue: true
    });
    if (!probe.result.value) return true;
    await delay(250);
  }
  return false;
}

async function devServerIsUp() {
  try {
    const response = await fetch(DEV_ORIGIN, { redirect: 'manual' });
    return response.status < 500;
  } catch {
    return false;
  }
}

async function waitForDebugger(port, attempts = 60) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return await response.json();
    } catch {
      /* not up yet */
    }
    await delay(250);
  }
  throw new Error(`Chrome did not expose a debugging port on ${port}`);
}

async function runBrowserChecks() {
  section('axe-core in headless Chrome');

  if (!(await devServerIsUp())) {
    console.log(`  SKIP  no dev server on ${DEV_ORIGIN} — start it with: npm run dev:worker`);
    return;
  }

  const chromePath = CHROME_CANDIDATES.find(candidate => existsSync(candidate));
  if (!chromePath) {
    console.log('  SKIP  no Chrome installation found');
    return;
  }

  const axePath = path.join(ROOT, 'node_modules', 'axe-core', 'axe.min.js');
  if (!existsSync(axePath)) {
    console.log('  SKIP  axe-core is not installed — run: npm install --save-dev axe-core');
    return;
  }
  const axeSource = readFileSync(axePath, 'utf8');

  const port = 9333 + (process.pid % 400);
  const profileDir = path.join(ROOT, '.tmp', `chrome-a11y-${process.pid}`);
  // `.tmp/` is gitignored; the profile is left in place rather than deleted,
  // because the sandbox's safe-delete shim cannot reliably remove Chrome's
  // several-hundred-file profile tree.
  const chrome = spawn(
    chromePath,
    [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profileDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--disable-extensions',
      '--hide-scrollbars',
      '--window-size=1280,900',
      'about:blank'
    ],
    { stdio: 'ignore' }
  );

  let cdp;
  try {
    await waitForDebugger(port);
    const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    const page = targets.find(target => target.type === 'page');
    if (!page) throw new Error('no page target available');

    const socket = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      socket.onopen = resolve;
      socket.onerror = () => reject(new Error('could not attach to the page target'));
    });
    cdp = new Cdp(socket);

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    // Guard: if the stylesheet does not load, every result below is measured on
    // an unstyled document and is worse than useless — contrast "passes" because
    // everything is black on white, and target sizes are meaningless. This
    // really happened: a stale `wrangler dev` asset manifest 404'd the hashed
    // CSS while still serving fresh HTML. Verify before trusting anything.
    await cdp.send('Page.navigate', { url: `${DEV_ORIGIN}/` });
    await delay(1500);
    const styleProbe = await cdp.send('Runtime.evaluate', {
      expression: `(() => {
        const root = getComputedStyle(document.documentElement);
        let rules = 0;
        for (const sheet of document.styleSheets) {
          try { rules += sheet.cssRules.length; } catch { /* cross-origin */ }
        }
        return JSON.stringify({
          spacing: root.getPropertyValue('--spacing').trim(),
          bodyBackground: getComputedStyle(document.body).backgroundColor,
          ruleCount: rules
        });
      })()`,
      returnByValue: true
    });
    const styles = JSON.parse(styleProbe.result.value);
    const styled = styles.spacing !== '' && styles.ruleCount > 0;
    check(
      'the site stylesheet is actually applied in the browser',
      styled,
      `--spacing="${styles.spacing}", ${styles.ruleCount} CSS rules, body background ${styles.bodyBackground}` +
        '\n        The dev server is serving HTML but not the built CSS — restart `npm run dev:worker`' +
        '\n        so it re-reads dist/, then run this again.'
    );
    if (!styled) return;

    const allViolations = [];
    const contrastResolved = [];

    for (const route of ROUTES) {
      const loaded = cdp.once('Page.loadEventFired');
      await cdp.send('Page.navigate', { url: `${DEV_ORIGIN}${route}` });
      await Promise.race([loaded, delay(15000)]);

      // Let hydration finish and every entrance animation complete before axe
      // measures anything, otherwise it samples mid-transition.
      await delay(500);
      await waitForAnimations(cdp);

      // Broken ARIA references are invisible to markup checks: the attribute is
      // present and well-formed, it just points at an id that does not exist in
      // the hydrated DOM. That really happened here — an accordion button kept
      // the id its panel had rendered with during prerender while the panel,
      // mounted later on first open, was given a different one, leaving
      // aria-controls dangling and the region unnamed. Only the live DOM shows
      // it, so assert it here rather than trusting the source.
      //
      // A collapsed disclosure is allowed to point at a panel it has not
      // mounted yet, so its aria-controls may dangle until it opens. Everything
      // else — including aria-controls on an expanded control — must resolve.
      const referenceProbe = await cdp.send('Runtime.evaluate', {
        expression: `(() => {
          const attrs = ['aria-controls', 'aria-labelledby', 'aria-describedby', 'aria-owns'];
          const broken = [];
          for (const attr of attrs) {
            for (const el of document.querySelectorAll('[' + attr + ']')) {
              const collapsed = el.getAttribute('aria-expanded') === 'false';
              const raw = el.getAttribute(attr) || '';
              for (const id of raw.split(/\\s+/).filter(Boolean)) {
                if (document.getElementById(id)) continue;
                if (attr === 'aria-controls' && collapsed) continue;
                broken.push(attr + '="' + id + '" on <' + el.tagName.toLowerCase() + '>');
              }
            }
          }
          return JSON.stringify([...new Set(broken)].slice(0, 8));
        })()`,
        returnByValue: true
      });
      const dangling = JSON.parse(referenceProbe.result.value);
      check(`${route} — every ARIA reference resolves in the hydrated DOM`,
        dangling.length === 0,
        dangling.join('\n        '));

      await cdp.send('Runtime.evaluate', { expression: axeSource });

      const result = await cdp.send('Runtime.evaluate', {
        expression: `axe.run(document, {
          resultTypes: ['violations', 'incomplete'],
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }
        }).then(r => JSON.stringify({
          violations: r.violations.map(v => ({
            id: v.id, impact: v.impact, help: v.help,
            count: v.nodes.length,
            targets: v.nodes.slice(0, 40).map(n => {
              // The target-size check records the measured box; colour-contrast
              // records the foreground/background and the ratio it computed.
              // Written with concatenation, not template literals: this whole
              // block is itself a template literal, and nested interpolation
              // would be evaluated by the wrong level.
              const data = [...(n.any || []), ...(n.all || [])].map(c => c.data).find(Boolean) || {};
              let detail = '';
              if (data.width !== undefined) {
                detail = ' [' + Math.round(data.width) + 'x' + Math.round(data.height) + 'px]';
              } else if (data.contrastRatio !== undefined) {
                detail = ' [ratio ' + data.contrastRatio + ' vs ' + data.expectedContrastRatio +
                  ', fg ' + data.fgColor + ' on bg ' + data.bgColor + ']';
              }
              const html = (n.html || '').replace(/\\s+/g, ' ').slice(0, 110);
              return n.target.join(' ') + detail + '\\n            ' + html;
            })
          })),
          incomplete: r.incomplete
            .filter(i => i.id === 'color-contrast')
            .map(i => ({
              id: i.id,
              count: i.nodes.length,
              targets: i.nodes.map(n => n.target.join(' '))
            }))
        }))`,
        awaitPromise: true,
        returnByValue: true
      });

      const payload = JSON.parse(result.result.value);
      const serious = payload.violations.filter(v => SERIOUS.has(v.impact));

      for (const violation of payload.violations) {
        allViolations.push({ route, ...violation });
      }

      const label = `${route} — ${serious.length === 0 ? 'no serious/critical violations' : `${serious.length} serious/critical`}`;
      check(label, serious.length === 0, serious
        .map(v => `${v.id} [${v.impact}] ${v.help} ×${v.count}\n          ${v.targets.join('\n          ')}`)
        .join('\n        '));

      // axe leaves `color-contrast` as *incomplete* whenever the background is
      // not a single flat colour — a gradient, a photograph, a decorative
      // overlay. Reporting that as an unexplained footnote would be the same as
      // not checking it, so resolve each node to a real ratio and assert.
      const contrastNode = payload.incomplete.find(i => i.id === 'color-contrast');
      if (contrastNode && contrastNode.targets.length) {
        await cdp.send('Runtime.evaluate', { expression: `window.__resolveContrast = ${CONTRAST_RESOLVER};` });
        const below = [];
        const seen = new Set();
        let exempt = 0;
        for (const target of contrastNode.targets) {
          if (seen.has(target)) continue;
          seen.add(target);
          const probe = await cdp.send('Runtime.evaluate', {
            expression: `window.__resolveContrast(${JSON.stringify(target)})`,
            returnByValue: true
          });
          let info;
          try { info = JSON.parse(probe.result.value); } catch { continue; }
          if (!info || info.missing || info.error) continue;
          if (info.decorative) { exempt += 1; continue; }

          // The analytic model cannot see through a translucent gradient to
          // whatever is beneath it, so for those nodes it would report failures
          // that are not there. Measure the rendered pixels instead.
          let measured = info;
          if (info.unresolvedBase) {
            const px = await measureContrastByPixels(cdp, target);
            if (!px) continue;
            measured = {
              ratio: px.ratio,
              required: px.required,
              passes: px.ratio >= px.required,
              compositedText: px.glyph,
              background: 'sampled pixels'
            };
          }
          if (!measured.passes) {
            below.push(`${target} — ${measured.ratio}:1, needs ${measured.required} (${measured.compositedText} on ${measured.background})`);
          }
        }
        contrastResolved.push({ route, total: seen.size, exempt, below });
        check(
          `${route} — the ${seen.size} undetermined contrast node(s) all resolve above threshold` +
            (exempt ? ` (${exempt} decorative, exempt)` : ''),
          below.length === 0,
          below.slice(0, 6).join('\n        ')
        );
      }
    }

    section('axe-core detail');
    if (allViolations.length === 0) {
      console.log('  No violations of any impact were reported.');
    } else {
      const byId = new Map();
      for (const violation of allViolations) {
        const key = `${violation.id} [${violation.impact}]`;
        if (!byId.has(key)) byId.set(key, { help: violation.help, routes: new Set(), count: 0 });
        const entry = byId.get(key);
        entry.routes.add(violation.route);
        entry.count += violation.count;
      }
      for (const [key, entry] of byId) {
        console.log(`  ${key} — ${entry.help}`);
        console.log(`    ${entry.count} node(s) across ${entry.routes.size} route(s)`);
      }
    }
    if (contrastResolved.length) {
      const total = contrastResolved.reduce((sum, r) => sum + r.total, 0);
      const exempt = contrastResolved.reduce((sum, r) => sum + r.exempt, 0);
      console.log(`  colour-contrast resolved for ${total} node(s) axe left undetermined` +
        (exempt ? `, ${exempt} of them decorative and therefore exempt` : ''));
    }
  } finally {
    try {
      await cdp?.send('Browser.close');
    } catch {
      /* already gone */
    }
    chrome.kill();
  }
}

/* ------------------------------------------------------------------ */

console.log('Phase 7 — accessibility checks');

if (!existsSync(DIST)) {
  console.error('\n  dist/ not found — run `npm run build` first.');
  process.exit(1);
}

runDocumentChecks();
runSourceChecks();
await runBrowserChecks();

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
if (failed > 0) {
  console.log('\nFailed checks:');
  for (const label of failures) console.log(`  - ${label}`);
  process.exit(1);
}
