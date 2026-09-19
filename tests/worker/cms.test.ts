import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

/**
 * CMS / quotation / media integration tests against a disposable local D1.
 *
 * Cloudflare Access is bypassed because `.dev.vars` enables the development
 * bypass under ENVIRONMENT=development — the production fail-closed boundary is
 * covered in tests/unit/worker-boundaries.test.ts.
 *
 * Requests carry an Origin header matching the worker origin so the
 * same-origin mutation guard is exercised on every state-changing call.
 */

const PORT = 8793;
const ORIGIN = `http://127.0.0.1:${PORT}`;

type ApiErrorBody = { error?: { code?: string; message?: string } };
type AnyBody = ApiErrorBody & Record<string, any>;

let child: ChildProcess;
let persistDir: string;

function killTree(pid: number | undefined): void {
  if (!pid) return;
  try {
    if (process.platform === 'win32') {
      execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      process.kill(-pid, 'SIGKILL');
    }
  } catch {
    /* already gone */
  }
}

async function admin(route: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (init.method && init.method !== 'GET') headers.set('Origin', ORIGIN);
  const response = await fetch(`${ORIGIN}/api/admin${route}`, { ...init, headers });
  const text = await response.text();
  let body: AnyBody | null;
  try {
    body = JSON.parse(text) as AnyBody;
  } catch {
    body = { raw: text };
  }
  return { status: response.status, body, headers: response.headers };
}

const post = (route: string, payload?: unknown) =>
  admin(route, { method: 'POST', body: JSON.stringify(payload ?? {}) });
const put = (route: string, payload: unknown) =>
  admin(route, { method: 'PUT', body: JSON.stringify(payload) });

/** Raw media upload — the endpoint takes the file as the request body. */
function uploadMedia(filename: string, contentType: string, bytes: Uint8Array, alt?: string) {
  const params = new URLSearchParams({ filename });
  if (alt) params.set('alt', alt);
  return admin(`/media?${params}`, {
    method: 'POST',
    body: bytes as unknown as BodyInit,
    headers: { 'Content-Type': contentType }
  });
}

/** A structurally real 8×8 PNG — signature + IHDR carrying width/height. */
function tinyPng(width = 8, height = 8): Uint8Array {
  const bytes = new Uint8Array(33);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const view = new DataView(bytes.buffer);
  view.setUint32(8, 13); // IHDR length
  bytes.set([0x49, 0x48, 0x44, 0x52], 12); // 'IHDR'
  view.setUint32(16, width);
  view.setUint32(20, height);
  bytes.set([8, 6, 0, 0, 0], 24); // bit depth, colour type, …
  view.setUint32(29, 0); // CRC (not validated by the sniffer)
  return bytes;
}

beforeAll(async () => {
  const wranglerCli = path.resolve('node_modules/wrangler/bin/wrangler.js');
  persistDir = mkdtempSync(path.join(tmpdir(), 'travision-cms-test-'));

  execFileSync(
    process.execPath,
    [wranglerCli, 'd1', 'migrations', 'apply', 'DB', '--local', '--persist-to', persistDir],
    { stdio: 'pipe' }
  );

  child = spawn(
    process.execPath,
    [wranglerCli, 'dev', '--port', String(PORT), '--persist-to', persistDir],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );

  const deadline = Date.now() + 90_000;
  let lastError = 'no attempt';
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${ORIGIN}/api/health`);
      if (response.ok) return;
      lastError = `health ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  killTree(child.pid);
  throw new Error(`CMS test worker never became healthy: ${lastError}`);
}, 180_000);

afterAll(async () => {
  killTree(child?.pid);
  await new Promise(resolve => setTimeout(resolve, 1500));
  try {
    rmSync(persistDir, { recursive: true, force: true });
  } catch {
    /* leftover temp dir is not worth failing over */
  }
});

const validTourFields = () => ({
  collection: 'day_tour',
  title: 'CMS Integration Test Tour',
  destination: 'Cairo',
  category: 'cultural',
  duration: '8 Hours',
  availability_label: 'Daily',
  price: 95,
  currency: 'USD',
  short_description: 'A tour used only by the integration test suite.',
  full_description: 'Longer description used by the integration test suite.',
  highlights: ['Pyramids', 'Museum'],
  itinerary: [{ day: 1, title: 'Morning', description: 'Pickup and visit.' }],
  inclusions: ['Guide'],
  exclusions: ['Tips'],
  cover_image: '/images/tours/cairo-day-tour/cover.webp',
  gallery: [],
  related_tours: []
});

describe('tour CMS lifecycle', () => {
  it('creates, reads, updates, duplicates, archives and restores a tour', async () => {
    const created = await post('/tours', { id: 'cms-integration-test-tour', fields: validTourFields() });
    expect(created.status).toBe(201);
    expect(created.body.tour.id).toBe('cms-integration-test-tour');
    expect(created.body.tour.status).toBe('draft');
    expect(created.body.tour.revision).toBe(1);

    const fetched = await admin('/tours/cms-integration-test-tour');
    expect(fetched.status).toBe(200);
    expect(fetched.body.tour.title).toBe('CMS Integration Test Tour');

    const updated = await put('/tours/cms-integration-test-tour', {
      fields: { title: 'Renamed Test Tour' },
      expectedRevision: 1
    });
    expect(updated.status).toBe(200);
    expect(updated.body.tour.revision).toBe(2);

    const duplicated = await post('/tours/cms-integration-test-tour/duplicate');
    expect(duplicated.status).toBe(201);
    expect(duplicated.body.tour.id).toBe('cms-integration-test-tour-copy');

    const archived = await post('/tours/cms-integration-test-tour/status', {
      status: 'archived',
      expectedRevision: 2
    });
    expect(archived.status).toBe(200);
    const restored = await post('/tours/cms-integration-test-tour/status', {
      status: 'draft',
      expectedRevision: 2
    });
    expect(restored.status).toBe(200);
  });

  it('rejects an optimistic-concurrency conflict', async () => {
    const stale = await put('/tours/cms-integration-test-tour', {
      fields: { title: 'Stale write' },
      expectedRevision: 1
    });
    expect(stale.status).toBe(409);
    expect(stale.body.error.code).toBe('revision_conflict');
  });

  it('rejects a duplicate id on create', async () => {
    const again = await post('/tours', {
      id: 'cms-integration-test-tour',
      fields: { ...validTourFields(), title: 'Different title' }
    });
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('duplicate_slug');
  });

  it('rejects unsafe markup in text fields', async () => {
    const bad = await post('/tours', {
      id: 'cms-evil-tour',
      fields: { ...validTourFields(), notes: '<script>alert(1)</script>' }
    });
    expect(bad.status).toBe(422);
  });

  it('rejects unknown fields so nothing is silently discarded', async () => {
    const bad = await post('/tours', {
      id: 'cms-unknown-field-tour',
      fields: { ...validTourFields(), invented_field: 'x' }
    });
    expect(bad.status).toBe(422);
    expect(bad.body.error.message).toContain('Unknown tour field');
  });
});

describe('post CMS lifecycle', () => {
  const validPostFields = () => ({
    slug: 'cms-test-post',
    title: 'CMS Test Post',
    excerpt: 'A test excerpt.',
    author: 'Travision Tours',
    content: 'Intro.\n\n## Section\n\nBody with [a link](/tours).',
    cover_image: '/images/blog/cover.webp',
    tags: ['test'],
    seo_title: 'CMS Test Post',
    meta_description: 'A test meta description.'
  });

  it('creates, warns on broken links, publishes and restores revisions', async () => {
    const created = await post('/posts', { fields: validPostFields() });
    expect(created.status).toBe(201);
    const postId = created.body.post.id;
    expect(created.body.post.status).toBe('draft');

    const updated = await put(`/posts/${postId}`, {
      fields: { content: 'Intro.\n\n## Section\n\nBody with [broken](/no-such-page).' },
      expectedRevision: 1
    });
    expect(updated.status).toBe(200);
    expect(updated.body.warnings.length).toBeGreaterThan(0);

    const published = await post(`/posts/${postId}/status`, {
      status: 'published',
      expectedRevision: 2
    });
    expect(published.status).toBe(200);

    const revisions = await admin(`/posts/${postId}/revisions`);
    expect(revisions.body.revisions.length).toBeGreaterThanOrEqual(2);

    const restored = await post(`/posts/${postId}/restore`, {
      revisionNo: 1,
      expectedRevision: 2
    });
    expect(restored.status).toBe(200);
    expect(restored.body.post.revision).toBe(3);
  });

  it('rejects a duplicate slug', async () => {
    const again = await post('/posts', {
      fields: { ...validPostFields(), title: 'Same slug again' }
    });
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('duplicate_slug');
  });
});

describe('inquiry notes, assignment and export', () => {
  let bookingId = '';

  it('creates an inquiry to work with', async () => {
    const response = await fetch(`${ORIGIN}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '10.30.0.1' },
      body: JSON.stringify({
        tourId: 'cairo-day-tour',
        name: 'CMS Tester',
        email: 'cms-tester@example.com',
        phone: '+201028838866',
        preferredDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        adults: 2,
        children: 0,
        travelers: 2,
        contactPreference: 'email',
        turnstileToken: 'dev-token',
        partnerPaymentAcknowledged: true
      })
    });
    expect(response.status).toBe(201);
    const reference = ((await response.json()) as { booking: { reference: string } }).booking.reference;
    // The public response intentionally carries the reference, not the row id.
    const list = await admin(`/bookings?reference=${reference}`);
    bookingId = list.body.bookings[0].id;
  });

  it('adds a private note and assigns the inquiry', async () => {
    const noted = await post(`/bookings/${bookingId}/notes`, { note: 'Called the customer.' });
    expect(noted.status).toBe(201);

    const assigned = await post(`/bookings/${bookingId}/assign`, {
      assignee: 'ops@travision.local'
    });
    expect(assigned.status).toBe(200);
    expect(assigned.body.booking.assigned_to).toBe('ops@travision.local');
  });

  it('exports the inquiry without IP data', async () => {
    const exported = await admin(`/bookings/${bookingId}/export`);
    expect(exported.status).toBe(200);
    const text = JSON.stringify(exported.body);
    expect(text).toContain('cms-tester@example.com');
    expect(text).not.toContain('10.30.0.1');
    expect(exported.headers.get('Content-Disposition')).toContain('attachment');
  });
});

describe('quotation workflow', () => {
  let quotationId = '';
  let bookingId = '';

  const completeQuotationData = {
    customerName: 'CMS Tester',
    customerEmail: 'cms-tester@example.com',
    customerPhone: '+201028838866',
    travelDates: '10–15 November 2026',
    adults: '2',
    childrenAges: 'None',
    pickupMeeting: 'Hotel lobby, Cairo',
    itinerary: 'Day 1: Pyramids and museum.',
    hotelSelection: 'Customer-arranged accommodation',
    roomTypeOccupancy: 'Not applicable',
    mealBasis: 'Not applicable',
    hotelChildPolicy: 'No children travelling.',
    childInfantPricing: 'Not applicable — no children travelling.',
    totalPrice: 'US$190.00 total for two adults',
    priceBreakdown: '2 adults × US$95.00',
    depositAmount: 'US$76.00 (40%)',
    balanceAndDeadline: 'US$114.00 due 30 days before travel',
    paymentRecipient: 'Egypt Online Tour',
    paymentMethods: 'Bank transfer or card link issued by Egypt Online Tour',
    paymentInstructions: 'Payment details are issued privately by Egypt Online Tour after acceptance.',
    cancellationSchedule: 'Full refund until 14 days before; 50% until 7 days; none after.',
    amendmentTerms: 'One free amendment up to 7 days before travel.',
    noShowPolicy: 'No refund for no-show.',
    unusedServicesPolicy: 'Unused services are not refundable.',
    specialConditions: 'None for this service.',
    inclusions: 'Guide and transport.',
    exclusions: 'Tips and personal spend.',
    optionalServices: 'None',
    specialRequests: 'None recorded',
    issueDate: '2026-09-16',
    expirationDate: '2026-10-01',
    eotContactDetails: 'Egypt Online Tour — reservations@egyptonlinetour.com',
    preparedBy: 'Travision Tours — Integration Test',
    customerNotes: '',
    currency: 'USD'
  };

  it('creates a draft quotation prefilled from an inquiry', async () => {
    const list = await admin('/bookings?limit=1');
    bookingId = list.body.bookings[0].id;
    const created = await post('/quotations', { bookingId });
    expect(created.status).toBe(201);
    quotationId = created.body.quotation.id;
    expect(created.body.quotation.status).toBe('draft');
    expect(created.body.quotation.reference).toMatch(/^TQ-/);
  });

  it('blocks review while required placeholders remain', async () => {
    const submitted = await post(`/quotations/${quotationId}/status`, { status: 'ready_for_review' });
    expect(submitted.status).toBe(422);
    expect(submitted.body.error.code).toBe('placeholders_unresolved');
  });

  it('rejects a cross-origin mutation', async () => {
    const response = await fetch(`${ORIGIN}/api/admin/quotations/${quotationId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example' },
      body: JSON.stringify({ status: 'ready_for_review' })
    });
    expect(response.status).toBe(403);
  });

  it('walks the full chain once fields are resolved', async () => {
    const saved = await put(`/quotations/${quotationId}`, {
      data: completeQuotationData,
      expectedRevision: 1
    });
    expect(saved.status).toBe(200);
    expect(saved.body.quotation.unresolved).toEqual([]);

    const chain: [string, Record<string, unknown>?][] = [
      ['ready_for_review'],
      ['approved'],
      ['sent'],
      ['accepted', { acceptanceMethod: 'email reply', acceptanceEvidence: 'Replied "we accept" 2026-09-18.' }],
      ['awaiting_payment'],
      ['paid'],
      ['confirmed']
    ];
    for (const [status, extra] of chain) {
      const step = await post(`/quotations/${quotationId}/status`, { status, ...extra });
      expect(step.status, `transition to ${status}`).toBe(200);
    }
  });

  it('freezes sent data — editing requires a new version', async () => {
    const mutated = await put(`/quotations/${quotationId}`, {
      data: { customerName: 'Changed After Send' },
      expectedRevision: 2
    });
    expect(mutated.status).toBe(409);
    expect(mutated.body.error.code).toBe('version_locked');

    const revised = await post(`/quotations/${quotationId}/revise`);
    expect(revised.status).toBe(200);
    expect(revised.body.quotation.version_no).toBe(2);
    expect(revised.body.quotation.status).toBe('draft');
  });

  it('keeps the sent snapshot as the customer document', async () => {
    // Revise again with a new name, then confirm the *sent* document still
    // shows the name that was actually sent.
    await put(`/quotations/${quotationId}`, {
      data: { customerName: 'Revised Name Not Sent' },
      expectedRevision: 3
    });
    const doc = await admin(`/quotations/${quotationId}/document`);
    expect(doc.status).toBe(200);
    const html = doc.body.raw as string;
    expect(html).toContain('CMS Tester');
    expect(html).not.toContain('Revised Name Not Sent');
    // Internal notes never reach the document.
    await put(`/quotations/${quotationId}`, {
      internalNotes: 'INTERNAL-ONLY-MARKER',
      expectedRevision: 4
    });
    const doc2 = await admin(`/quotations/${quotationId}/document?preview=1`);
    expect((doc2.body.raw as string)).not.toContain('INTERNAL-ONLY-MARKER');
  });

  it('records the full status history with the acting admin', async () => {
    const detail = await admin(`/quotations/${quotationId}`);
    const history = detail.body.history as { from_status: string; to_status: string; actor: string }[];
    expect(history.length).toBeGreaterThanOrEqual(7);
    expect(history.some(h => h.to_status === 'confirmed')).toBe(true);
    expect(history.every(h => h.actor === 'dev-bypass@localhost')).toBe(true);
    // The sent version is recorded.
    expect(detail.body.quotation.sent_version_no).toBe(1);
  });

  it('cannot confirm an unsent quotation', async () => {
    const created = await post('/quotations', {});
    const id = created.body.quotation.id;
    const jump = await post(`/quotations/${id}/status`, { status: 'confirmed' });
    expect(jump.status).toBe(422);
    expect(jump.body.error.code).toBe('invalid_transition');
  });
});

describe('media library', () => {
  it('accepts a real PNG with alt text', async () => {
    const uploaded = await uploadMedia('test.png', 'image/png', tinyPng(), 'Test image');
    expect(uploaded.status).toBe(201);
    expect(uploaded.body.media.object_key).toMatch(/^media\/[0-9a-f-]+\.png$/);
  });

  it('rejects a missing alt text', async () => {
    const uploaded = await uploadMedia('noalt.png', 'image/png', tinyPng());
    expect(uploaded.status).toBe(422);
    expect(uploaded.body.error.code).toBe('validation_error');
  });

  it('rejects a mismatched signature (declared PNG, random bytes)', async () => {
    const uploaded = await uploadMedia('fake.png', 'image/png', new TextEncoder().encode('not an image'), 'alt');
    expect(uploaded.status).toBe(422);
    expect(uploaded.body.error.code).toBe('unsupported_media');
  });

  it('rejects an executable', async () => {
    const uploaded = await uploadMedia(
      'tool.exe',
      'application/x-msdownload',
      new Uint8Array([0x4d, 0x5a, 0x90, 0x00]),
      'alt'
    );
    expect(uploaded.status).toBe(422);
  });

  it('rejects SVG', async () => {
    const uploaded = await uploadMedia(
      'icon.svg',
      'image/svg+xml',
      new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>'),
      'alt'
    );
    expect(uploaded.status).toBe(422);
  });

  it('rejects a declared/detected MIME mismatch', async () => {
    const uploaded = await uploadMedia('actually-jpeg.png', 'image/jpeg', tinyPng(), 'alt');
    expect(uploaded.status).toBe(422);
    expect(uploaded.body.error.code).toBe('mime_mismatch');
  });

  it('sanitises a traversal filename — the client name never reaches the key', async () => {
    const uploaded = await uploadMedia('../../etc/passwd.png', 'image/png', tinyPng(), 'alt');
    expect(uploaded.status).toBe(201);
    expect(uploaded.body.media.object_key).toMatch(/^media\/[0-9a-f-]+\.png$/);
  });

  it('blocks archiving referenced media, allows archiving unreferenced', async () => {
    const referenced = await uploadMedia('referenced.png', 'image/png', tinyPng(), 'Referenced');
    const mediaId = referenced.body.media.id;

    // Reference it from a tour's cover image via the served URL.
    await post('/tours', {
      id: 'media-ref-tour',
      fields: { ...validTourFields(), cover_image: `/api/admin/media/${mediaId}/file` }
    });

    const blocked = await post(`/media/${mediaId}/archive`);
    expect(blocked.status).toBe(409);
    expect(blocked.body.error.code).toBe('media_in_use');

    const usage = await admin(`/media/${mediaId}/usage`);
    expect(usage.body.usage.some((u: { entity: string; id: string }) => u.id === 'media-ref-tour')).toBe(true);

    const fresh = await uploadMedia('unreferenced.png', 'image/png', tinyPng(), 'Unreferenced');
    const archived = await post(`/media/${fresh.body.media.id}/archive`);
    expect(archived.status).toBe(200);
    expect(archived.body.media.status).toBe('archived');
  });
});

describe('overview, audit and revisions', () => {
  it('reports content and quotation counts', async () => {
    const overview = await admin('/overview');
    expect(overview.status).toBe(200);
    expect(overview.body.counts.toursDraft).toBeGreaterThanOrEqual(1);
    expect(overview.body.counts.newInquiries).toBeGreaterThanOrEqual(1);
    expect(overview.body.counts.quotationsDraft).toBeGreaterThanOrEqual(1);
    expect(overview.body.paymentPartner).toBe('Egypt Online Tour');
  });

  it('reports the development bypass on the session', async () => {
    const session = await admin('/session');
    expect(session.body.devBypass).toBe(true);
    expect(session.body.environment).toBe('development');
  });

  it('records audit events with the actor, without secrets', async () => {
    const audit = await admin('/audit?limit=50');
    expect(audit.status).toBe(200);
    const events = audit.body.audit as { actor: string; action: string; summary: string }[];
    expect(events.length).toBeGreaterThan(0);
    expect(events.every(e => e.actor === 'dev-bypass@localhost')).toBe(true);
    expect(events.some(e => e.action === 'quotation.status')).toBe(true);
    expect(JSON.stringify(events)).not.toContain('INTERNAL-ONLY-MARKER');
  });

  it('lists revisions across all entity types', async () => {
    const revisions = await admin('/revisions?limit=50');
    expect(revisions.status).toBe(200);
    const entities = new Set(
      (revisions.body.revisions as { entity_type: string }[]).map(r => r.entity_type)
    );
    expect(entities.has('tour')).toBe(true);
    expect(entities.has('post')).toBe(true);
    expect(entities.has('quotation')).toBe(true);
  });
});
