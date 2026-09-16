/**
 * Verify that every external origin the built site can load is permitted by the
 * Content Security Policy declared in public/_headers.
 *
 * This is a static check: it scans the built output for absolute URLs and
 * compares their origins against the policy's allow-list. It cannot replace a
 * browser pass — it says nothing about inline-script or inline-style behaviour —
 * but it reliably catches the most common CSP failure: shipping a resource from
 * an origin the policy does not allow.
 *
 * Run after `npm run build`:  node scripts/check-csp.mjs
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const distDir = path.join(root, 'dist');
const headersPath = path.join(root, 'public', '_headers');

/**
 * Origins that appear in the build but are never loaded as a CSP-governed
 * resource, each with the reason it is safe to ignore.
 *
 * These are all strings embedded in the bundle — documentation links inside
 * library error messages, licence banners and XML namespaces — not URLs the
 * browser requests. They were each confirmed by inspecting the surrounding
 * source before being listed here.
 */
const NOT_FETCHED = new Map([
  ['schema.org', 'JSON-LD @context value — parsed, never requested'],
  ['wa.me', 'outbound link navigation — not governed by CSP fetch directives'],
  ['travisiontours.com', 'the site itself (canonical/OG URLs in markup)'],
  ['www.w3.org', 'XML namespace URI — never requested'],
  ['www.sitemaps.org', 'sitemap XML namespace (xmlns) — never requested'],
  ['localhost', 'React Router internal base URL for relative-path parsing'],
  ['react.dev', 'React error-message link template, never requested'],
  ['reactrouter.com', 'React Router error-message link, never requested'],
  ['tailwindcss.com', 'licence banner comment in the compiled Tailwind CSS'],
  ['egyptonlinetour.com', 'source-attribution strings in tourPolicies.ts — metadata for traceability, never rendered or requested']
]);

/** Extensions worth scanning for external references. */
const SCAN_EXTENSIONS = new Set(['.js', '.css', '.html', '.json', '.webmanifest', '.xml']);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (SCAN_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

function parsePolicy(headersText) {
  const line = headersText
    .split(/\r?\n/)
    .find(row => /^\s*Content-Security-Policy(-Report-Only)?:/i.test(row));

  if (!line) {
    throw new Error('No Content-Security-Policy header found in public/_headers.');
  }

  const enforcing = !/Report-Only/i.test(line.split(':')[0]);
  const value = line.slice(line.indexOf(':') + 1).trim();
  const directives = new Map();

  for (const part of value.split(';')) {
    const tokens = part.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;
    const [name, ...sources] = tokens;
    directives.set(name.toLowerCase(), sources);
  }

  return { value, directives, enforcing };
}

function allowedOrigins(directives) {
  const origins = new Set();
  for (const [name, sources] of directives) {
    // Only fetch directives name origins. `frame-ancestors` restricts who may
    // frame us, so its sources are not loadable origins.
    if (name === 'frame-ancestors') continue;
    for (const source of sources) {
      if (source.startsWith('https://')) {
        origins.add(new URL(source).origin);
      } else if (source.startsWith('*.')) {
        origins.add(`wildcard:${source}`);
      }
    }
  }
  return origins;
}

function isAllowed(origin, allowed) {
  if (allowed.has(origin)) return true;
  const host = new URL(origin).hostname;
  for (const entry of allowed) {
    if (entry.startsWith('wildcard:') && host.endsWith(entry.slice('wildcard:'.length + 1))) {
      return true;
    }
  }
  return false;
}

async function run() {
  try {
    await stat(distDir);
  } catch {
    console.error('dist/ not found. Run `npm run build` first.');
    process.exitCode = 1;
    return;
  }

  const { directives, enforcing } = parsePolicy(await readFile(headersPath, 'utf8'));
  const allowed = allowedOrigins(directives);

  console.log(`Policy mode: ${enforcing ? 'ENFORCING' : 'REPORT-ONLY'}`);
  console.log(`Directives:  ${[...directives.keys()].join(', ')}`);
  console.log(`Allowed origins: ${[...allowed].sort().join(', ') || '(none)'}\n`);

  const files = await walk(distDir);
  const found = new Map();

  for (const file of files) {
    const content = await readFile(file, 'utf8');
    for (const match of content.matchAll(/https?:\/\/[a-zA-Z0-9._:-]+/g)) {
      const raw = match[0].replace(/[.,;:'")\]]+$/, '');
      let origin;
      try {
        origin = new URL(raw).origin;
      } catch {
        continue;
      }
      if (!found.has(origin)) found.set(origin, new Set());
      found.get(origin).add(path.relative(distDir, file));
    }
  }

  const unexplained = [];

  for (const [origin, sources] of [...found].sort()) {
    const host = new URL(origin).hostname;
    const isSelf = origin === 'https://travisiontours.com';
    const ignored = isSelf || NOT_FETCHED.has(host) || NOT_FETCHED.has(host.replace(/^www\./, ''));

    if (ignored) {
      const reason = isSelf
        ? NOT_FETCHED.get('travisiontours.com')
        : NOT_FETCHED.get(host) ?? NOT_FETCHED.get(host.replace(/^www\./, ''));
      console.log(`  skip   ${origin}  (${reason})`);
      continue;
    }

    if (isAllowed(origin, allowed)) {
      console.log(`  allow  ${origin}`);
    } else {
      console.log(`  MISS   ${origin}  <- referenced by ${[...sources].join(', ')}`);
      unexplained.push({ origin, sources: [...sources] });
    }
  }

  console.log('');

  if (unexplained.length > 0) {
    console.error(
      `FAIL: ${unexplained.length} external origin(s) are not permitted by the policy:`
    );
    for (const item of unexplained) {
      console.error(`  - ${item.origin} (in ${item.sources.join(', ')})`);
    }
    console.error('\nAdd the origin to the appropriate directive in public/_headers, or add it to');
    console.error('NOT_FETCHED in this script with a reason if it is never actually requested.');
    process.exitCode = 1;
    return;
  }

  console.log('PASS: every external origin referenced by the build is permitted by the policy.');
}

run().catch(error => {
  console.error('CSP check crashed:', error);
  process.exitCode = 2;
});
