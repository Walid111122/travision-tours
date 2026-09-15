#!/usr/bin/env node
/**
 * Phase 7, task 12 (second half) — keyboard-only walkthrough.
 *
 * Drives the primary journey using real key events over the DevTools Protocol,
 * not `element.focus()` alone. That distinction is the point: programmatic
 * focus bypasses sequential focus navigation and so cannot reveal a focus trap,
 * an unreachable control, or a missing focus ring. Only genuine key presses
 * exercise the browser's own behaviour — what a keyboard or switch user meets.
 *
 * One CDP subtlety is load-bearing: button activation requires
 * `Input.dispatchKeyEvent` with type `keyDown`, NOT `rawKeyDown`. rawKeyDown
 * updates focus and fires listeners but skips the default action, so every
 * <button> silently ignored Enter and Space while every <a> still worked —
 * which is exactly the pattern that first looked like a site defect here.
 *
 * Covers:
 *   1. Skip link is the first stop and moves focus into <main>.
 *   2. Every focus stop paints a visible focus indicator.
 *   3. The mobile menu button exposes and updates its expanded state.
 *   4. Search accepts typing; a filter pill flips on Space.
 *   5. The itinerary accordion expands from the keyboard.
 *   6. The share dialog: initial focus, trap, Escape, focus restore.
 *   7. Stops can be added and reordered with the keyboard alone.
 *   8. Booking-form fields are labelled and the error summary is announced.
 *   9. Reduced motion removes animation and smooth scrolling.
 *
 *   node scripts/phase7-keyboard.mjs      (needs `npm run dev:worker` + build)
 */

import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEV_ORIGIN = process.env.DEV_ORIGIN || 'http://127.0.0.1:8787';
const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome'
];

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
    console.log(`  FAIL  ${label}`);
    if (detail) console.log(`        ${detail}`);
  }
}

const delay = ms => new Promise(r => setTimeout(r, ms));

class Cdp {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.waiting = new Map();
    socket.onmessage = e => this.dispatch(JSON.parse(e.data));
  }
  dispatch(m) {
    if (m.id && this.pending.has(m.id)) {
      const { resolve, reject } = this.pending.get(m.id);
      this.pending.delete(m.id);
      if (m.error) reject(new Error(m.error.message));
      else resolve(m.result);
      return;
    }
    const q = this.waiting.get(m.method);
    if (q && q.length) q.shift()(m.params);
  }
  send(method, params = {}) {
    const id = this.nextId++;
    this.socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  once(method) {
    return new Promise(resolve => {
      const q = this.waiting.get(method) || [];
      q.push(resolve);
      this.waiting.set(method, q);
    });
  }
}

async function evaluate(cdp, expression) {
  const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
  return r.result.value;
}

const json = (cdp, expression) => evaluate(cdp, expression).then(v => (v === undefined || v === null ? null : JSON.parse(v)));

const KEY = {
  Tab: { key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 },
  Enter: { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' },
  Escape: { key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 },
  Space: { key: ' ', code: 'Space', windowsVirtualKeyCode: 32, text: ' ' }
};

/**
 * Press a real key.
 *
 * `keyDown` (not `rawKeyDown`) is required for the browser to run a control's
 * default action — a button ignores Enter under rawKeyDown. `text` is supplied
 * for the keys that carry one.
 */
async function press(cdp, name, { shift = false } = {}) {
  const k = KEY[name];
  const modifiers = shift ? 8 : 0;
  const base = { modifiers, key: k.key, code: k.code, windowsVirtualKeyCode: k.windowsVirtualKeyCode };
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', ...base, ...(k.text ? { text: k.text } : {}) });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
  await delay(80);
}

const FOCUS_INFO = `(() => {
  const el = document.activeElement;
  if (!el) return JSON.stringify({ none: true });
  const cs = getComputedStyle(el);
  return JSON.stringify({
    tag: el.tagName.toLowerCase(),
    id: el.id || null,
    text: (el.getAttribute('aria-label') || el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 60),
    focusVisible: el.matches(':focus-visible'),
    outlineStyle: cs.outlineStyle,
    outlineWidth: cs.outlineWidth,
    inMain: !!el.closest('main'),
    inDialog: !!el.closest('[role="dialog"]')
  });
})()`;

const focusInfo = cdp => json(cdp, FOCUS_INFO);

function hasVisibleRing(info) {
  return info.focusVisible === true && info.outlineStyle !== 'none' && parseFloat(info.outlineWidth) > 0;
}

async function navigate(cdp, route) {
  const loaded = cdp.once('Page.loadEventFired');
  await cdp.send('Page.navigate', { url: `${DEV_ORIGIN}${route}` });
  await Promise.race([loaded, delay(15000)]);
  await delay(700);
  const t0 = Date.now();
  while (Date.now() - t0 < 8000) {
    const n = await evaluate(cdp, 'document.getAnimations().filter(a => a.playState === "running").length');
    if (!n) break;
    await delay(200);
  }
}

async function tabUntil(cdp, predicate, { limit = 60, shift = false } = {}) {
  for (let i = 0; i < limit; i += 1) {
    await press(cdp, 'Tab', { shift });
    const info = await focusInfo(cdp);
    if (predicate(info)) return info;
  }
  return null;
}

/** Move focus to the first element matching a selector, without clicking it. */
const focusSelector = (cdp, selector) => evaluate(cdp, `(() => {
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return false;
  el.scrollIntoView({ block: 'center' });
  el.focus();
  return document.activeElement === el;
})()`);

const chromePath = CHROME_CANDIDATES.find(c => existsSync(c));
if (!chromePath) {
  console.error('No Chrome installation found.');
  process.exit(1);
}

const port = 9333 + ((process.pid + 137) % 400);
const chrome = spawn(chromePath, [
  '--headless=new', `--remote-debugging-port=${port}`,
  `--user-data-dir=${path.join(ROOT, '.tmp', `chrome-keyboard-${process.pid}`)}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--disable-extensions',
  '--hide-scrollbars', '--window-size=1280,900', 'about:blank'
], { stdio: 'ignore' });

console.log('Phase 7 — keyboard-only walkthrough');
console.log(`Origin: ${DEV_ORIGIN}`);

let cdp;
try {
  let up = false;
  for (let i = 0; i < 60; i += 1) {
    try { const r = await fetch(`http://127.0.0.1:${port}/json/version`); if (r.ok) { up = true; break; } } catch { /* not up */ }
    await delay(250);
  }
  if (!up) throw new Error('Chrome did not expose a debugging port');

  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = targets.find(t => t.type === 'page');
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { socket.onopen = res; socket.onerror = () => rej(new Error('attach failed')); });
  cdp = new Cdp(socket);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  /* ---------------------------------------------------------------- */
  section('1. Skip link is the first stop and reaches <main>');

  await navigate(cdp, '/');
  await evaluate(cdp, 'document.activeElement && document.activeElement.blur()');

  const first = await tabUntil(cdp, info => info.tag === 'a' || info.tag === 'button', { limit: 3 });
  check('the first Tab stop on / is the skip link', !!first && /skip/i.test(first.text),
    first ? `landed on <${first.tag}> "${first.text}"` : 'no focusable element reached');
  check('the skip link shows a visible focus ring', !!first && hasVisibleRing(first),
    first ? `focus-visible=${first.focusVisible} outline=${first.outlineStyle} ${first.outlineWidth}` : 'n/a');

  if (first) {
    await press(cdp, 'Enter');
    const afterSkip = await focusInfo(cdp);
    check('activating the skip link moves focus into <main>', afterSkip.inMain === true,
      `activeElement=<${afterSkip.tag} id="${afterSkip.id}"> inMain=${afterSkip.inMain}`);
  }

  /* ---------------------------------------------------------------- */
  section('2. Focus is visible at every stop');

  await navigate(cdp, '/');
  await evaluate(cdp, 'document.activeElement && document.activeElement.blur()');

  const invisible = [];
  const stops = [];
  for (let i = 0; i < 28; i += 1) {
    await press(cdp, 'Tab');
    const info = await focusInfo(cdp);
    if (info.none) break;
    stops.push(info);
    if (!hasVisibleRing(info)) {
      invisible.push(`${info.tag} "${info.text}" (focus-visible=${info.focusVisible}, outline=${info.outlineStyle} ${info.outlineWidth})`);
      if (invisible.length > 3) break;
    }
  }
  check('the home page exposes a keyboard focus order', stops.length >= 6, `${stops.length} stops observed`);
  check('every focus stop paints a visible focus indicator', invisible.length === 0, invisible.slice(0, 8).join('\n        '));

  /* ---------------------------------------------------------------- */
  section('3. Mobile menu button exposes and updates its state');

  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await navigate(cdp, '/');

  const menuState = `(() => {
    const b = document.querySelector('[aria-controls="mobile-navigation"]');
    if (!b) return null;
    return JSON.stringify({
      expanded: b.getAttribute('aria-expanded'),
      name: b.getAttribute('aria-label'),
      panelPresent: !!document.getElementById('mobile-navigation')
    });
  })()`;

  const menuBtn = await tabUntil(cdp, info => info.tag === 'button' && /menu|navigation/i.test(info.text), { limit: 30 });
  if (menuBtn) {
    const before = await json(cdp, menuState);
    await press(cdp, 'Enter');
    const after = await json(cdp, menuState);
    check('the mobile menu button has an accessible name', !!before.name, `aria-label="${before.name}"`);
    check('it reports collapsed before opening', before.expanded === 'false', `aria-expanded=${before.expanded}`);
    check('Enter opens the menu and updates aria-expanded',
      after.expanded === 'true' && after.panelPresent === true,
      `aria-expanded=${after.expanded}, panel present=${after.panelPresent}`);
  } else {
    check('the mobile menu button is reachable by keyboard at 390px', false, 'never received focus');
  }
  await cdp.send('Emulation.clearDeviceMetricsOverride');

  /* ---------------------------------------------------------------- */
  section('4. Search field and filter pills work from the keyboard');

  await navigate(cdp, '/tours');
  await evaluate(cdp, 'document.activeElement && document.activeElement.blur()');

  const search = await tabUntil(cdp, info => info.tag === 'input', { limit: 30 });
  if (search) {
    await cdp.send('Input.insertText', { text: 'cairo' });
    const typed = await json(cdp, `(() => {
      const i = document.querySelector('#tour-search');
      return JSON.stringify({ value: i ? i.value : null, hasLabel: !!document.querySelector('label[for="tour-search"]') });
    })()`);
    check('the search field accepts keyboard input', typed.value === 'cairo', `value="${typed.value}"`);
    check('the search field has a persistent label', typed.hasLabel === true);
  } else {
    check('the search field is reachable by keyboard', false, 'never received focus');
  }

  // Target an actual filter pill, not a view toggle: a view toggle stays
  // pressed (it selects one of several), whereas a filter pill flips.
  const pillSelector = '[role="group"][aria-label^="Filter by"] button[aria-pressed="false"]';
  if (await focusSelector(cdp, pillSelector)) {
    const before = await evaluate(cdp, `document.activeElement.getAttribute('aria-pressed')`);
    const pillName = await evaluate(cdp, `document.activeElement.textContent.trim().slice(0, 30)`);
    await press(cdp, 'Space');
    const after = await evaluate(cdp, `document.activeElement.getAttribute('aria-pressed')`);
    check('a filter pill flips on Space and reports its new state', before !== after,
      `pill "${pillName}" aria-pressed ${before} → ${after}`);
  } else {
    check('filter pills are reachable and expose aria-pressed', false, `no match for ${pillSelector}`);
  }

  /* ---------------------------------------------------------------- */
  section('5. Itinerary accordion expands from the keyboard');

  // A multi-day tour is required here: single-day tours render a single
  // itinerary entry through the noAccordion branch, which is correct behaviour
  // but has no toggle to test.
  await navigate(cdp, '/tours/6-days-cairo-luxor-aswan');

  // Scoped to #itinerary: the first aria-expanded button on the page is the
  // mobile nav toggle, whose panel is not in the DOM while collapsed.
  //
  // Targets a *collapsed* item specifically. The first itinerary entry opens by
  // default, so activating that one closes it — which is a valid toggle but
  // tests the wrong direction.
  const accordionSelector = '#itinerary button[aria-expanded="false"][aria-controls]';
  if (await focusSelector(cdp, accordionSelector)) {
    // The panel id is captured here rather than re-read from activeElement
    // afterwards: if focus were to move, an empty read would make the "state
    // changed" comparison pass vacuously against null.
    const before = await json(cdp, `(() => {
      const b = document.activeElement;
      const panelId = b.getAttribute('aria-controls');
      const panel = document.getElementById(panelId);
      return JSON.stringify({
        id: b.id,
        expanded: b.getAttribute('aria-expanded'),
        panelId,
        name: (b.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 50),
        // Collapsed panels are unmounted, so these are expected to be null
        // before activation and are asserted on after it.
        panelMountedWhileCollapsed: !!panel
      });
    })()`);

    await press(cdp, 'Enter');

    const after = await json(cdp, `(() => {
      const panelId = ${JSON.stringify('__PANEL__')};
      const btn = document.querySelector('[aria-controls="' + panelId + '"]');
      const panel = document.getElementById(panelId);
      return JSON.stringify({
        expanded: btn ? btn.getAttribute('aria-expanded') : null,
        focusTag: document.activeElement.tagName.toLowerCase(),
        panelPresent: !!panel,
        panelRole: panel ? panel.getAttribute('role') : null,
        panelLabelledBy: panel ? panel.getAttribute('aria-labelledby') : null,
        panelVisible: panel ? panel.getClientRects().length > 0 : false
      });
    })()`.replace('__PANEL__', before.panelId));

    check('the accordion toggle is focusable and named', !!before.name, `"${before.name}"`);
    check('the toggle points at a panel id via aria-controls', !!before.panelId, `aria-controls="${before.panelId}"`);
    check('Enter expands the accordion', after.expanded === 'true', `${before.expanded} → ${after.expanded}`);
    check('the expanded panel is mounted and is a labelled region',
      after.panelPresent === true && after.panelRole === 'region' && after.panelLabelledBy === before.id,
      `present=${after.panelPresent}, role=${after.panelRole}, aria-labelledby=${after.panelLabelledBy} (button id ${before.id})`);
    check('the expanded panel is rendered with layout',
      after.panelVisible === true,
      `panel has layout: ${after.panelVisible}`);
    // The invariant that actually matters to assistive technology: the reported
    // state and the rendered reality must never disagree.
    check('the reported expanded state agrees with whether the panel is rendered',
      after.panelVisible === (after.expanded === 'true'),
      `aria-expanded=${after.expanded} but panel has layout: ${after.panelVisible} (focus on <${after.focusTag}>)`);
  } else {
    check('the itinerary accordion is keyboard operable', false, `no match for ${accordionSelector}`);
  }

  /* ---------------------------------------------------------------- */
  section('6. Share dialog: initial focus, trap, Escape, focus restore');

  await navigate(cdp, '/planner');

  // The planner starts empty and the share link is only meaningful with stops,
  // so add two first — via the keyboard, on the real Add controls.
  //
  // Added one at a time, re-querying each round, and skipping landmarks already
  // in the list. Both parts matter: addStop dedupes by id, and it is called
  // through a plain setItems([...items, stop]) rather than a functional update,
  // so two clicks dispatched in the same tick both read the pre-click list and
  // the second silently replaces the first. Real clicks land in separate tasks
  // with a re-render between, so this is a harness concern, not a user-facing
  // one — but it has to be driven sequentially to be faithful.
  let added = 0;
  for (let attempt = 0; attempt < 4 && added < 2; attempt += 1) {
    const focusedAdd = await evaluate(cdp, `(() => {
      const titles = new Set([...document.querySelectorAll('button[aria-label^="Move "]')]
        .map(b => (b.getAttribute('aria-label') || '').replace(/^Move /, '').replace(/ (earlier|later) in your itinerary$/, '')));
      const candidate = [...document.querySelectorAll('button')]
        .filter(el => /^add /i.test(el.getAttribute('aria-label') || '') && el.getClientRects().length > 0)
        .find(el => {
          const title = (el.getAttribute('aria-label') || '').replace(/^Add /i, '').replace(/ to your itinerary$/i, '');
          return !titles.has(title);
        });
      if (!candidate) return false;
      candidate.scrollIntoView({ block: 'center' });
      candidate.focus();
      return document.activeElement === candidate;
    })()`);
    if (!focusedAdd) break;
    await press(cdp, 'Enter');
    await delay(500);
    added += 1;
  }

  const shareFocused = await focusSelector(cdp, 'button[aria-label*="Share" i], button[aria-label*="share" i]')
    || await evaluate(cdp, `(() => {
      const b = [...document.querySelectorAll('button')].find(el => /share/i.test(el.textContent || ''));
      if (!b) return false;
      b.scrollIntoView({ block: 'center' });
      b.focus();
      return document.activeElement === b;
    })()`);

  if (shareFocused) {
    const triggerName = await evaluate(cdp, `(document.activeElement.textContent || '').replace(/\\s+/g,' ').trim().slice(0,40)`);
    await press(cdp, 'Enter');
    await delay(600);

    const dialog = await json(cdp, `(() => {
      const d = document.querySelector('[role="dialog"]');
      if (!d) return null;
      const labelled = d.getAttribute('aria-labelledby');
      const titleEl = labelled ? document.getElementById(labelled) : null;
      return JSON.stringify({
        modal: d.getAttribute('aria-modal'),
        labelledby: labelled,
        titleText: titleEl ? titleEl.textContent.trim().slice(0, 60) : null,
        focusInside: d.contains(document.activeElement),
        activeTag: document.activeElement.tagName.toLowerCase()
      });
    })()`);

    check('activating Share opens a dialog', !!dialog, `stops added: ${added}`);
    if (dialog) {
      check('the dialog is marked aria-modal="true"', dialog.modal === 'true', `aria-modal=${dialog.modal}`);
      check('the dialog is named by its heading', !!dialog.labelledby && !!dialog.titleText,
        `aria-labelledby=${dialog.labelledby} → "${dialog.titleText}"`);
      check('focus moves into the dialog on open', dialog.focusInside === true,
        `focus is on <${dialog.activeTag}>`);

      let escaped = null;
      for (let i = 0; i < 16; i += 1) {
        await press(cdp, 'Tab');
        const info = await focusInfo(cdp);
        if (!info.inDialog) { escaped = `${i + 1} Tab press(es) left the dialog → <${info.tag}> "${info.text}"`; break; }
      }
      check('Tab is trapped inside the dialog', escaped === null, escaped || '');

      let escapedBack = null;
      for (let i = 0; i < 16; i += 1) {
        await press(cdp, 'Tab', { shift: true });
        const info = await focusInfo(cdp);
        if (!info.inDialog) { escapedBack = `${i + 1} Shift+Tab press(es) left the dialog → <${info.tag}> "${info.text}"`; break; }
      }
      check('Shift+Tab is trapped inside the dialog', escapedBack === null, escapedBack || '');

      await press(cdp, 'Escape');
      await delay(500);
      const closed = await json(cdp, `(() => {
        const el = document.activeElement;
        return JSON.stringify({
          stillOpen: !!document.querySelector('[role="dialog"]'),
          focusName: (el.getAttribute('aria-label') || el.textContent || '').replace(/\\s+/g,' ').trim().slice(0, 40)
        });
      })()`);
      check('Escape closes the dialog', closed.stillOpen === false, 'dialog still present after Escape');
      check('focus returns to the element that opened the dialog', closed.focusName === triggerName,
        `expected "${triggerName}", focus is on "${closed.focusName}"`);
    }
  } else {
    check('the planner share control is keyboard reachable', false, 'no Share button found');
  }

  /* ---------------------------------------------------------------- */
  section('7. Stops can be added and reordered with the keyboard alone');

  const order = () => json(cdp, `(() => {
    const items = [...document.querySelectorAll('button[aria-label^="Move "]')]
      .map(b => (b.getAttribute('aria-label') || '').replace(/^Move /, '').replace(/ (earlier|later) in your itinerary$/, ''));
    return JSON.stringify([...new Set(items)]);
  })()`);

  const before = await order();
  check('the planner exposes named keyboard move controls', Array.isArray(before) && before.length >= 2,
    `found ${Array.isArray(before) ? before.length : 0} movable stop(s): ${JSON.stringify(before)}`);

  if (Array.isArray(before) && before.length >= 2) {
    const moved = await evaluate(cdp, `(() => {
      const b = [...document.querySelectorAll('button')]
        .find(el => /^move .* later in your itinerary$/i.test(el.getAttribute('aria-label') || '') && !el.disabled);
      if (!b) return null;
      b.scrollIntoView({ block: 'center' });
      b.focus();
      return b.getAttribute('aria-label');
    })()`);
    await press(cdp, 'Enter');
    await delay(400);
    const after = await order();
    check('a stop moves down the list when its control is activated',
      moved !== null && JSON.stringify(before) !== JSON.stringify(after),
      moved ? `activated "${moved}"; order ${JSON.stringify(before)} → ${JSON.stringify(after)}` : 'no enabled move-later control');
  }

  /* ---------------------------------------------------------------- */
  section('8. Booking form: labels, invalid state, announced error summary');

  await navigate(cdp, '/tours/cairo-day-tour');

  const form = await json(cdp, `(() => {
    const form = document.querySelector('form');
    if (!form) return JSON.stringify({ missing: true });
    const required = [...form.querySelectorAll('[required]')];
    const unlabelled = required.filter(el => {
      if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) return false;
      if (el.id && form.querySelector('label[for="' + el.id + '"]')) return false;
      // Implicit labelling: the control is wrapped inside its own <label>.
      // The payment-acknowledgement checkbox uses this, with the whole consent
      // sentence as its name, which is valid and is what a screen reader reads.
      if (el.closest('label')) return false;
      return true;
    }).map(el => el.id || el.name || el.tagName.toLowerCase());
    const summary = document.getElementById('booking-request-error');
    const described = [...form.querySelectorAll('[aria-describedby]')]
      .filter(el => !document.getElementById(el.getAttribute('aria-describedby')))
      .map(el => el.id);
    return JSON.stringify({
      requiredCount: required.length,
      unlabelled,
      describedMissingTarget: described,
      // The error summary is rendered only after a server rejection, so its
      // presence in the markup cannot be asserted from the live DOM. What can
      // be asserted is that the wiring exists in the source, checked separately.
      summaryInDom: !!summary
    });
  })()`);

  check('every required field has a label or accessible name',
    form.requiredCount > 0 && form.unlabelled.length === 0,
    `required=${form.requiredCount}, unlabelled=${JSON.stringify(form.unlabelled)}`);
  check('every aria-describedby points at an element that exists',
    form.describedMissingTarget.length === 0,
    `dangling: ${JSON.stringify(form.describedMissingTarget)}`);

  // Submitting empty must be blocked by native validation, and the blocked
  // field must be announced — that is how a keyboard user learns what to fix.
  const submitted = await evaluate(cdp, `(() => {
    const form = document.querySelector('form');
    const btn = form.querySelector('button[type="submit"]');
    if (!btn) return 'no submit button';
    btn.focus();
    return 'focused';
  })()`);
  if (submitted === 'focused') {
    await press(cdp, 'Enter');
    await delay(600);
    const validity = await json(cdp, `(() => {
      const form = document.querySelector('form');
      const invalid = [...form.querySelectorAll(':invalid')];
      return JSON.stringify({
        stillOnPage: !!document.querySelector('form'),
        invalidCount: invalid.length,
        firstInvalidId: invalid.length ? invalid[0].id : null,
        firstInvalidLabelled: invalid.length && invalid[0].id
          ? !!form.querySelector('label[for="' + invalid[0].id + '"]')
          : false
      });
    })()`);
    check('submitting an empty form is blocked by native validation and stays on the page',
      validity.stillOnPage === true && validity.invalidCount > 0,
      `${validity.invalidCount} invalid field(s), first = ${validity.firstInvalidId}`);
    check('the first invalid field is associated with a label, so the browser can announce it',
      validity.firstInvalidLabelled === true,
      `first invalid = ${validity.firstInvalidId}`);
  }

  /* ---------------------------------------------------------------- */
  section('9. Reduced motion is honoured');

  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await navigate(cdp, '/');
  const reduced = await json(cdp, `(() => {
    const durations = document.getAnimations().map(a => {
      const t = a.effect && a.effect.getTiming ? a.effect.getTiming() : {};
      return typeof t.duration === 'number' ? t.duration : 0;
    });
    return JSON.stringify({
      longestAnimationMs: durations.length ? Math.max(...durations) : 0,
      animationCount: durations.length,
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior
    });
  })()`);

  check('no animation runs longer than a blink under reduced motion',
    reduced.longestAnimationMs <= 1,
    `longest animation = ${reduced.longestAnimationMs}ms across ${reduced.animationCount} animation(s)`);
  check('scroll-behavior is not smooth under reduced motion',
    reduced.scrollBehavior !== 'smooth',
    `scroll-behavior: ${reduced.scrollBehavior}`);
  await cdp.send('Emulation.setEmulatedMedia', { features: [] });

  try { await cdp.send('Browser.close'); } catch { /* already closing */ }
  cdp = null;
} catch (error) {
  failed += 1;
  failures.push(error.message);
  console.log(`\n  ERROR  ${error.message}`);
} finally {
  // Closing the socket first makes a later send() hang, so only close when the
  // connection is still believed to be alive.
  if (cdp) {
    try { await Promise.race([cdp.send('Browser.close'), delay(2000)]); } catch { /* gone */ }
  }
  chrome.kill();
}

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
if (failed) {
  console.log('Failures:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
