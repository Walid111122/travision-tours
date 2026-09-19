/**
 * Phase 3 acceptance tests.
 *
 * Each functional case uses a unique CF-Connecting-IP so the D1 rate limiter
 * gives it a fresh bucket; the throttling case deliberately reuses one.
 */

const BASE = 'http://127.0.0.1:8787';
const CATALOG_TOUR_ID = 'cairo-day-tour';

let passed = 0;
let failed = 0;
const createdReferences = [];

function check(name, condition, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function validPayload(overrides = {}) {
  const future = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  return {
    tourId: CATALOG_TOUR_ID,
    name: 'Walid Tester',
    email: 'walid@example.com',
    phone: '+20 102 883 8866',
    country: 'Egypt',
    preferredDate: future,
    adults: 2,
    children: 0,
    travelers: 2,
    contactPreference: 'email',
    turnstileToken: 'dev-token',
    partnerPaymentAcknowledged: true,
    ...overrides
  };
}

async function post(ip, body, { raw = false, contentType = 'application/json' } = {}) {
  const response = await fetch(`${BASE}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': contentType, 'CF-Connecting-IP': ip },
    body: raw ? body : JSON.stringify(body)
  });
  const parsed = await response.json().catch(() => null);
  if (response.status === 201 && parsed?.booking?.reference) {
    createdReferences.push(parsed.booking.reference);
  }
  return { status: response.status, body: parsed, headers: response.headers };
}

async function admin(path, init) {
  const response = await fetch(`${BASE}/api/admin${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init
  });
  return { status: response.status, body: await response.json().catch(() => null) };
}

async function run() {
  console.log('\n=== 3.1 Request validation ===');

  let result = await post('10.0.0.1', validPayload({ preferredDate: '2027-02-31' }));
  check('impossible date (Feb 31) rejected', result.status === 422, `got ${result.status}`);

  result = await post('10.0.0.2', validPayload({ preferredDate: '2027-06-10', departureDate: '2027-06-01' }));
  check('departure before arrival rejected', result.status === 422, `got ${result.status}`);

  result = await post('10.0.0.3', validPayload({ phone: 'call-me-maybe' }));
  check('non-numeric phone rejected', result.status === 422, `got ${result.status}`);

  result = await post('10.0.0.4', validPayload({ phone: '123' }));
  check('too-short phone rejected', result.status === 422, `got ${result.status}`);

  result = await post('10.0.0.5', validPayload({ email: 'not-an-email' }));
  check('malformed email rejected', result.status === 422, `got ${result.status}`);

  result = await post('10.0.0.6', validPayload({ children: 2, travelers: 4, childAges: '5' }));
  check('child-age count mismatch rejected', result.status === 422, `got ${result.status}`);

  result = await post('10.0.0.7', validPayload({ children: 1, travelers: 3, childAges: 'twenty' }));
  check('non-numeric child age rejected', result.status === 422, `got ${result.status}`);

  result = await post('10.0.0.8', validPayload({ children: 1, travelers: 3, childAges: '25' }));
  check('child age over the limit rejected', result.status === 422, `got ${result.status}`);

  result = await post('10.0.0.9', validPayload({ adults: 0, travelers: 0 }));
  check('adults below minimum rejected', result.status === 422, `got ${result.status}`);

  result = await post('10.0.0.10', validPayload({ adults: 51, travelers: 51 }));
  check('adults above maximum rejected', result.status === 422, `got ${result.status}`);

  result = await post('10.0.0.11', validPayload({ adults: 2, children: 0, travelers: 5 }));
  check('traveler total mismatch rejected', result.status === 422, `got ${result.status}`);

  result = await post('10.0.0.12', validPayload({ contactPreference: 'carrier-pigeon' }));
  check('unknown enum value rejected', result.status === 422, `got ${result.status}`);

  result = await post('10.0.0.13', validPayload({ name: 'x'.repeat(200) }));
  check('over-length string rejected', result.status === 422, `got ${result.status}`);

  result = await post('10.0.0.14', validPayload({ tourId: 'made-up-tour-id' }));
  check(
    'unknown tour ID rejected',
    result.status === 422 && result.body?.error?.code === 'unknown_tour',
    `got ${result.status} / ${result.body?.error?.code}`
  );

  result = await post(
    '10.0.0.15',
    validPayload({ tourTitle: 'FREE LUXURY TOUR — PRICE 0', tourId: CATALOG_TOUR_ID })
  );
  check('client-supplied tour title is ignored', result.status === 201, `got ${result.status}`);

  console.log('\n=== 3.2 Idempotency and duplicate prevention ===');

  const key = crypto.randomUUID();
  const first = await post('10.0.1.1', validPayload({ idempotencyKey: key }));
  const second = await post('10.0.1.2', validPayload({ idempotencyKey: key }));
  check('first submission created a booking', first.status === 201, `got ${first.status}`);
  check(
    'replay returns the original reference',
    second.status === 200 && second.body?.booking?.reference === first.body?.booking?.reference,
    `${second.status} ${second.body?.booking?.reference} vs ${first.body?.booking?.reference}`
  );
  check('replay is flagged', second.body?.replay === true);

  const distinct = await post('10.0.1.3', validPayload({ idempotencyKey: crypto.randomUUID() }));
  check('a separate intentional inquiry is still accepted', distinct.status === 201, `got ${distinct.status}`);

  result = await post('10.0.1.4', validPayload({ idempotencyKey: 'not-a-uuid' }));
  check('malformed submission key rejected', result.status === 422, `got ${result.status}`);

  console.log('\n=== 3.3 Abuse protection ===');

  result = await post('10.0.2.1', validPayload({ companyWebsite: 'https://spam.example' }));
  check('honeypot rejected', result.status === 422, `got ${result.status}`);

  result = await post('10.0.2.2', 'plain text', { raw: true, contentType: 'text/plain' });
  check('unsupported content type rejected', result.status === 415, `got ${result.status}`);

  result = await post('10.0.2.3', JSON.stringify({ padding: 'x'.repeat(20 * 1024) }), { raw: true });
  check('oversized body rejected', result.status === 413, `got ${result.status}`);

  result = await post('10.0.2.4', '{ not json', { raw: true });
  check('malformed JSON rejected', result.status === 400, `got ${result.status}`);

  const throttleIp = '10.0.9.9';
  const throttleStatuses = [];
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await post(throttleIp, validPayload({ idempotencyKey: crypto.randomUUID() }));
    throttleStatuses.push(response.status);
    if (response.status === 429) {
      check('throttled response carries Retry-After', Boolean(response.headers.get('Retry-After')));
    }
  }
  check(
    'burst submissions are throttled after the configured limit',
    throttleStatuses.filter(status => status === 201).length === 5 && throttleStatuses[5] === 429,
    throttleStatuses.join(',')
  );

  console.log('\n=== 3.4 Planner inquiries and notification outbox ===');

  const planner = await post('10.0.3.1', {
    source: 'planner',
    itineraryStopIds: ['1', '2', '3'],
    name: 'Walid Planner',
    email: 'walid@example.com',
    phone: '+201028838866',
    preferredDate: new Date(Date.now() + 40 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    adults: 2,
    children: 0,
    travelers: 2,
    turnstileToken: 'dev-token',
    partnerPaymentAcknowledged: true
  });
  check('planner inquiry accepted', planner.status === 201, `got ${planner.status} ${JSON.stringify(planner.body)}`);
  check('planner inquiry reports its source', planner.body?.booking?.source === 'planner');
  check('planner inquiry reports stop count', planner.body?.booking?.stopCount === 3);

  result = await post('10.0.3.2', {
    source: 'planner',
    itineraryStopIds: ['not-a-real-stop'],
    name: 'Walid',
    email: 'walid@example.com',
    phone: '+201028838866',
    preferredDate: new Date(Date.now() + 40 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    adults: 1,
    children: 0,
    travelers: 1,
    partnerPaymentAcknowledged: true
  });
  check('unknown planner stop rejected', result.status === 422, `got ${result.status}`);

  result = await post('10.0.3.3', {
    source: 'planner',
    itineraryStopIds: ['1', '1'],
    name: 'Walid',
    email: 'walid@example.com',
    phone: '+201028838866',
    preferredDate: new Date(Date.now() + 40 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    adults: 1,
    children: 0,
    travelers: 1,
    partnerPaymentAcknowledged: true
  });
  check('duplicate planner stops rejected', result.status === 422, `got ${result.status}`);

  result = await post('10.0.3.4', {
    source: 'planner',
    itineraryStopIds: Array.from({ length: 21 }, (_, index) => `stop-${index}`),
    name: 'Walid',
    email: 'walid@example.com',
    phone: '+201028838866',
    preferredDate: new Date(Date.now() + 40 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    adults: 1,
    children: 0,
    travelers: 1,
    partnerPaymentAcknowledged: true
  });
  check('over-long itinerary rejected', result.status === 422, `got ${result.status}`);

  const sent = await admin('/notifications?status=sent&limit=5');
  check(
    'accepted inquiries produced delivered outbox rows',
    sent.status === 200 && (sent.body?.notifications?.length ?? 0) > 0,
    `got ${sent.status} with ${sent.body?.notifications?.length} rows`
  );
  check(
    'outbox payloads carry no personal data',
    sent.body?.notifications?.every(row => !JSON.stringify(row).includes('walid@example.com')),
  );

  console.log('\n=== 3.5 Secure lead review ===');

  const session = await admin('/session');
  check('authorised operator session resolves', session.status === 200 && session.body?.authorized === true);

  const list = await admin('/bookings?limit=5');
  check('booking list is reachable by an authorised operator', list.status === 200 && Array.isArray(list.body?.bookings));

  const detailId = list.body?.bookings?.[0]?.id;
  const detail = await admin(`/bookings/${encodeURIComponent(detailId)}`);
  check('booking detail includes audit history', detail.status === 200 && Array.isArray(detail.body?.history));
  check('booking detail includes notification rows', Array.isArray(detail.body?.notifications));

  const currentStatus = detail.body?.booking?.status;
  const nextStatus = currentStatus === 'new' ? 'quoted' : 'new';
  const change = await admin(`/bookings/${encodeURIComponent(detailId)}/status`, {
    method: 'POST',
    body: JSON.stringify({ status: nextStatus })
  });
  check('valid status transition applied', change.status === 200, `got ${change.status}`);

  const afterChange = await admin(`/bookings/${encodeURIComponent(detailId)}`);
  const lastHistory = afterChange.body?.history?.at(-1);
  check(
    'status change recorded with actor and time',
    lastHistory?.actor === 'dev-bypass@localhost' && Boolean(lastHistory?.created_at),
    JSON.stringify(lastHistory)
  );

  const invalid = await admin(`/bookings/${encodeURIComponent(detailId)}/status`, {
    method: 'POST',
    body: JSON.stringify({ status: 'not-a-status' })
  });
  check('unknown status rejected', invalid.status === 422, `got ${invalid.status}`);

  console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
  console.log(`References created during this run: ${createdReferences.length}`);
  console.log(JSON.stringify(createdReferences));
  process.exitCode = failed === 0 ? 0 : 1;
}

run().catch(error => {
  console.error('Test run crashed:', error);
  process.exitCode = 2;
});
