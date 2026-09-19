import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer, type Server } from 'node:http';
import { execFileSync, spawn, type ChildProcess } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

/**
 * Worker integration tests against a disposable local D1.
 *
 * Two `wrangler dev` instances are used, each with its own `--persist-to`
 * directory created by `mkdtemp` and deleted afterwards, so the suite never
 * touches the developer's `.wrangler/state` and leaves nothing behind:
 *
 *   A. migrated   — the normal request surface and the notification outbox.
 *   B. unmigrated — the database-failure path. With no `bookings` table the D1
 *                   batch throws a non-`ApiError`, which must surface as a clean
 *                   500 `internal_error` rather than a crash or a leaked message.
 *
 * Turnstile and Cloudflare Access are bypassed here because `.dev.vars` enables
 * both for `ENVIRONMENT=development`. That is asserted rather than assumed (see
 * the health test), and the production fail-closed behaviour of both boundaries
 * is covered in `tests/unit/worker-boundaries.test.ts` — it cannot be exercised
 * from a development instance.
 *
 * Ports are deliberately not 8787, so a developer running `npm run dev:worker`
 * can run this suite at the same time.
 */

const PORT_A = 8791;
const PORT_B = 8792;
const PROVIDER_PORT = 8795;

const ORIGIN_A = `http://127.0.0.1:${PORT_A}`;
const ORIGIN_B = `http://127.0.0.1:${PORT_B}`;

type Worker = { origin: string; persistDir: string; child: ChildProcess };

type ApiErrorBody = {
  error?: { code?: string; message?: string };
};

type BookingBody = ApiErrorBody & {
  booking?: {
    reference?: string;
    status?: string;
    source?: string;
    stopCount?: number;
  };
  replay?: boolean;
  payment?: { recipient?: string; instructions?: string };
};

type BookingSummary = { id: string; tour_title?: string };
type NotificationRow = {
  id: number;
  booking_id: string;
  status?: string;
  attempts: number;
  last_error?: string | null;
};
type HistoryRow = { actor?: string | null; created_at?: string };
type AdminBody = ApiErrorBody & {
  authorized?: boolean;
  bookings?: BookingSummary[];
  booking?: { status?: string };
  notifications?: NotificationRow[];
  history?: HistoryRow[];
  sent?: number;
};
type HealthBody = {
  status?: string;
  environment?: string;
  turnstileBypassed?: boolean;
};

async function jsonBody<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

function killTree(pid: number | undefined): void {
  if (!pid) return;
  try {
    if (process.platform === 'win32') {
      // `wrangler dev` spawns a chain (npx -> wrangler -> wrangler-cli -> workerd).
      // Killing only the parent leaves an orphaned workerd holding the port.
      execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      process.kill(-pid, 'SIGKILL');
    }
  } catch {
    /* already gone */
  }
}

async function startWorker(options: {
  port: number;
  migrate: boolean;
  vars?: Record<string, string>;
}): Promise<Worker> {
  const wranglerCli = path.resolve('node_modules/wrangler/bin/wrangler.js');
  const persistDir = mkdtempSync(path.join(tmpdir(), `travision-test-${options.port}-`));

  if (options.migrate) {
    execFileSync(
      process.execPath,
      [
        wranglerCli,
        'd1',
        'migrations',
        'apply',
        'DB',
        '--local',
        '--persist-to',
        persistDir
      ],
      { stdio: 'pipe' }
    );
  }

  const varFlags = Object.entries(options.vars ?? {}).flatMap(([key, value]) => [
    '--var',
    `${key}:${value}`
  ]);

  const child = spawn(
    process.execPath,
    [wranglerCli, 'dev', '--port', String(options.port), '--persist-to', persistDir, ...varFlags],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );

  const origin = `http://127.0.0.1:${options.port}`;
  const deadline = Date.now() + 90_000;
  let lastError = 'no attempt made';

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${origin}/api/health`);
      if (response.ok) return { origin, persistDir, child };
      lastError = `health returned ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  killTree(child.pid);
  throw new Error(`Worker on port ${options.port} never became healthy: ${lastError}`);
}

async function stopWorker(worker: Worker | undefined): Promise<void> {
  if (!worker) return;
  killTree(worker.child.pid);
  // Give Windows a moment to release the SQLite file handles before deleting.
  await new Promise(resolve => setTimeout(resolve, 1500));
  try {
    rmSync(worker.persistDir, { recursive: true, force: true });
  } catch {
    /* a leftover temp directory is not worth failing the suite over */
  }
}

/** A stand-in notification provider whose availability the test controls. */
let providerMode: 'fail' | 'ok' = 'fail';
let provider: Server;

const futureDate = (days = 30) =>
  new Date(Date.now() + days * 24 * 3600 * 1000).toISOString().slice(0, 10);

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    tourId: 'cairo-day-tour',
    name: 'Integration Tester',
    email: 'integration@example.com',
    phone: '+201028838866',
    country: 'Egypt',
    preferredDate: futureDate(),
    adults: 2,
    children: 0,
    travelers: 2,
    contactPreference: 'email',
    turnstileToken: 'dev-token',
    partnerPaymentAcknowledged: true,
    ...overrides
  };
}

async function post(
  origin: string,
  ip: string,
  body: unknown,
  { raw = false, contentType = 'application/json' } = {}
) {
  const response = await fetch(`${origin}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': contentType, 'CF-Connecting-IP': ip },
    body: raw ? (body as string) : JSON.stringify(body)
  });
  return {
    status: response.status,
    body: await jsonBody<BookingBody>(response).catch(() => null),
    headers: response.headers
  };
}

async function admin(origin: string, route: string, init?: RequestInit) {
  const response = await fetch(`${origin}/api/admin${route}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init
  });
  return { status: response.status, body: await jsonBody<AdminBody>(response).catch(() => null) };
}

let workerA: Worker;
let workerB: Worker;

beforeAll(async () => {
  provider = createServer((request, response) => {
    request.resume();
    request.on('end', () => {
      if (providerMode === 'fail') {
        response.writeHead(503, { 'Content-Type': 'text/plain' });
        response.end('provider unavailable');
        return;
      }
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end('{"ok":true}');
    });
  });
  await new Promise<void>(resolve => provider.listen(PROVIDER_PORT, '127.0.0.1', resolve));

  workerA = await startWorker({
    port: PORT_A,
    migrate: true,
    // Point the outbox at the controllable provider. `--var` overrides the empty
    // NOTIFICATION_WEBHOOK_URL declared in .dev.vars; if it did not, the logging
    // adapter would be selected and every delivery would succeed, making the
    // failure and retry tests silently vacuous.
    vars: { NOTIFICATION_WEBHOOK_URL: `http://127.0.0.1:${PROVIDER_PORT}/notify` }
  });
}, 180_000);

afterAll(async () => {
  await stopWorker(workerA);
  await stopWorker(workerB);
  await new Promise<void>(resolve => provider?.close(() => resolve()));
});

describe('health endpoint', () => {
  it('reports ok and the active environment', async () => {
    const response = await fetch(`${ORIGIN_A}/api/health`);
    expect(response.status).toBe(200);
    const body = await jsonBody<HealthBody>(response);
    expect(body.status).toBe('ok');
    expect(body.environment).toBe('development');
  });

  it('confirms the development bypasses are active, so the suite knows why it can submit', async () => {
    // Without this the rest of the suite would be passing for an unknown reason:
    // a token-less submission only succeeds because Turnstile is bypassed.
    const body = await jsonBody<HealthBody>(await fetch(`${ORIGIN_A}/api/health`));
    expect(body.turnstileBypassed).toBe(true);
  });
});

describe('valid booking creation', () => {
  it('stores an inquiry and returns a reference', async () => {
    const result = await post(ORIGIN_A, '10.10.0.1', validPayload());
    expect(result.status).toBe(201);
    expect(result.body?.booking?.reference).toMatch(/^TV-\d{8}-[0-9A-F]{8}$/);
    expect(result.body?.booking?.status).toBe('new');
    expect(result.body?.replay).toBe(false);
  });

  it('never echoes the payment relationship in a way that implies Travision collects', async () => {
    const result = await post(ORIGIN_A, '10.10.0.2', validPayload());
    expect(result.body?.payment?.recipient).toBe('Egypt Online Tour');
    expect(result.body?.payment?.instructions).toMatch(/does not collect payment/i);
  });

  it('ignores a client-supplied tour title', async () => {
    const result = await post(
      ORIGIN_A,
      '10.10.0.3',
      validPayload({ tourTitle: 'FREE LUXURY TOUR — PRICE 0' })
    );
    expect(result.status).toBe(201);
    // The stored title comes from the catalog; the operator view is the authority
    // for what was actually requested.
    const list = await admin(ORIGIN_A, '/bookings?limit=1');
    expect(list.body?.bookings?.[0]?.tour_title).toBe('Cairo Day Tour');
  });
});

describe('request framing', () => {
  it('rejects an unsupported content type', async () => {
    const result = await post(ORIGIN_A, '10.11.0.1', 'plain text', {
      raw: true,
      contentType: 'text/plain'
    });
    expect(result.status).toBe(415);
  });

  it('rejects malformed JSON', async () => {
    const result = await post(ORIGIN_A, '10.11.0.2', '{ not json', { raw: true });
    expect(result.status).toBe(400);
  });

  it('rejects an oversized body', async () => {
    const result = await post(ORIGIN_A, '10.11.0.3', JSON.stringify({ padding: 'x'.repeat(20 * 1024) }), {
      raw: true
    });
    expect(result.status).toBe(413);
  });

  it('returns a structured error for an unknown API route', async () => {
    const response = await fetch(`${ORIGIN_A}/api/does-not-exist`);
    expect(response.status).toBe(404);
    const body = await jsonBody<ApiErrorBody>(response);
    expect(body.error.code).toBe('not_found');
  });
});

describe('field validation', () => {
  it('rejects a payload with no fields at all', async () => {
    const result = await post(ORIGIN_A, '10.12.0.1', {});
    expect(result.status).toBe(422);
    expect(result.body?.error?.code).toBe('validation_error');
  });

  it.each([
    ['impossible date', { preferredDate: '2027-02-31' }],
    ['departure before arrival', { preferredDate: '2027-06-10', departureDate: '2027-06-01' }],
    ['non-numeric phone', { phone: 'call-me-maybe' }],
    ['malformed email', { email: 'not-an-email' }],
    ['traveler total mismatch', { adults: 2, children: 0, travelers: 5 }],
    ['unknown contact preference', { contactPreference: 'carrier-pigeon' }],
    ['over-length name', { name: 'x'.repeat(200) }],
    ['child ages do not match the count', { children: 2, travelers: 4, childAges: '5' }],
    ['adults below the minimum', { adults: 0, travelers: 0 }],
    ['adults above the maximum', { adults: 51, travelers: 51 }]
  ])('rejects %s', async (_label, overrides) => {
    const result = await post(ORIGIN_A, `10.13.0.${Math.abs(hash(JSON.stringify(overrides))) % 250 + 1}`, validPayload(overrides));
    expect(result.status).toBe(422);
  });

  it('rejects an unknown tour ID with a distinct code', async () => {
    const result = await post(ORIGIN_A, '10.14.0.1', validPayload({ tourId: 'made-up-tour-id' }));
    expect(result.status).toBe(422);
    expect(result.body?.error?.code).toBe('unknown_tour');
  });

  it('rejects a submission that has not acknowledged partner payment', async () => {
    const result = await post(
      ORIGIN_A,
      '10.14.0.2',
      validPayload({ partnerPaymentAcknowledged: false })
    );
    expect(result.status).toBe(422);
    expect(result.body?.error?.code).toBe('partner_payment_acknowledgement_required');
  });

  it('rejects the honeypot field', async () => {
    const result = await post(
      ORIGIN_A,
      '10.14.0.3',
      validPayload({ companyWebsite: 'https://spam.example' })
    );
    expect(result.status).toBe(422);
  });
});

/** Small deterministic string hash, only used to spread test IPs. */
function hash(value: string): number {
  let out = 0;
  for (let i = 0; i < value.length; i += 1) out = (out * 31 + value.charCodeAt(i)) | 0;
  return out;
}

describe('Turnstile at the integration boundary', () => {
  it('accepts a token-less submission only because the development bypass is on', async () => {
    // Production fail-closed (503 abuse_protection_unavailable, and 422
    // turnstile_required when a token is missing) is asserted in the unit suite.
    const withoutToken = validPayload({ turnstileToken: undefined });
    const result = await post(ORIGIN_A, '10.15.0.1', withoutToken);
    expect(result.status).toBe(201);

    const health = await jsonBody<HealthBody>(await fetch(`${ORIGIN_A}/api/health`));
    expect(health.turnstileBypassed).toBe(true);
  });
});

describe('idempotency', () => {
  it('replays the original reference for a repeated submission key', async () => {
    const key = crypto.randomUUID();
    const first = await post(ORIGIN_A, '10.16.0.1', validPayload({ idempotencyKey: key }));
    const second = await post(ORIGIN_A, '10.16.0.2', validPayload({ idempotencyKey: key }));

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body?.booking?.reference).toBe(first.body?.booking?.reference);
    expect(second.body?.replay).toBe(true);
  });

  it('rejects the same key when the normalized inquiry details differ', async () => {
    const key = crypto.randomUUID();
    const first = await post(ORIGIN_A, '10.16.1.1', validPayload({ idempotencyKey: key }));
    const changed = await post(
      ORIGIN_A,
      '10.16.1.2',
      validPayload({ idempotencyKey: key, adults: 3, travelers: 3 })
    );

    expect(first.status).toBe(201);
    expect(changed.status).toBe(409);
    expect(changed.body?.error?.code).toBe('idempotency_conflict');
  });

  it('accepts a different key as a separate inquiry', async () => {
    const result = await post(ORIGIN_A, '10.16.0.3', validPayload({ idempotencyKey: crypto.randomUUID() }));
    expect(result.status).toBe(201);
  });

  it('rejects a malformed submission key', async () => {
    const result = await post(ORIGIN_A, '10.16.0.4', validPayload({ idempotencyKey: 'not-a-uuid' }));
    expect(result.status).toBe(422);
  });
});

describe('rate limiting', () => {
  it('throttles a burst after the configured limit and sets Retry-After', async () => {
    const ip = '10.17.9.9';
    const statuses: number[] = [];
    let retryAfter: string | null = null;

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const result = await post(ORIGIN_A, ip, validPayload({ idempotencyKey: crypto.randomUUID() }));
      statuses.push(result.status);
      if (result.status === 429) retryAfter = result.headers.get('Retry-After');
    }

    // RATE_LIMIT_MAX_REQUESTS is 5 in wrangler.jsonc.
    expect(statuses.slice(0, 5)).toEqual([201, 201, 201, 201, 201]);
    expect(statuses[5]).toBe(429);
    expect(retryAfter).toBeTruthy();
  });
});

describe('planner inquiries', () => {
  it('accepts a planner inquiry and reports its stop count', async () => {
    const result = await post(ORIGIN_A, '10.18.0.1', {
      source: 'planner',
      itineraryStopIds: ['1', '2', '3'],
      name: 'Planner Tester',
      email: 'integration@example.com',
      phone: '+201028838866',
      preferredDate: futureDate(40),
      adults: 2,
      children: 0,
      travelers: 2,
      turnstileToken: 'dev-token',
      partnerPaymentAcknowledged: true
    });
    expect(result.status).toBe(201);
    expect(result.body?.booking?.source).toBe('planner');
    expect(result.body?.booking?.stopCount).toBe(3);
  });

  it('rejects an unknown planner stop', async () => {
    const result = await post(ORIGIN_A, '10.18.0.2', {
      source: 'planner',
      itineraryStopIds: ['not-a-real-stop'],
      name: 'Planner Tester',
      email: 'integration@example.com',
      phone: '+201028838866',
      preferredDate: futureDate(40),
      adults: 1,
      children: 0,
      travelers: 1,
      partnerPaymentAcknowledged: true
    });
    expect(result.status).toBe(422);
  });
});

describe('notification outbox', () => {
  it('records a delivery failure with an attempt count and backoff', async () => {
    providerMode = 'fail';
    const result = await post(ORIGIN_A, '10.19.0.1', validPayload({ idempotencyKey: crypto.randomUUID() }));
    expect(result.status).toBe(201);

    const failed = await admin(ORIGIN_A, '/notifications?status=failed&limit=20');
    expect(failed.status).toBe(200);
    const row = failed.body.notifications.find(
      (notification: NotificationRow) => notification.booking_id && notification.attempts >= 1
    );
    expect(row).toBeTruthy();
    expect(row.attempts).toBeGreaterThanOrEqual(1);
    expect(row.last_error).toBeTruthy();
  });

  it('carries no personal data in the outbox payload', async () => {
    const sent = await admin(ORIGIN_A, '/notifications?limit=50');
    expect(sent.status).toBe(200);
    // The payload identifies the inquiry by reference only; personal detail stays
    // behind the protected operator view.
    expect(JSON.stringify(sent.body.notifications)).not.toContain('integration@example.com');
    expect(JSON.stringify(sent.body.notifications)).not.toContain('Integration Tester');
  });

  it('delivers a previously failed notification once the provider recovers', async () => {
    providerMode = 'fail';
    await post(ORIGIN_A, '10.19.0.2', validPayload({ idempotencyKey: crypto.randomUUID() }));

    const failed = await admin(ORIGIN_A, '/notifications?status=failed&limit=50');
    const target = failed.body.notifications[0];
    expect(target).toBeTruthy();

    providerMode = 'ok';
    const retry = await admin(ORIGIN_A, `/notifications/${target.id}/retry`, { method: 'POST' });
    expect(retry.status).toBe(200);
    expect(retry.body.sent).toBeGreaterThanOrEqual(1);

    const after = await admin(ORIGIN_A, '/notifications?limit=100');
    const retried = after.body.notifications.find((n: { id: number }) => n.id === target.id);
    expect(retried.status).toBe('sent');
    expect(retried.attempts).toBeGreaterThan(target.attempts);
  });

  it('reports 404 when retrying a notification that does not exist', async () => {
    const retry = await admin(ORIGIN_A, '/notifications/999999/retry', { method: 'POST' });
    expect(retry.status).toBe(404);
  });
});

describe('secure lead review', () => {
  it('resolves an authorised operator session', async () => {
    const session = await admin(ORIGIN_A, '/session');
    expect(session.status).toBe(200);
    expect(session.body.authorized).toBe(true);
  });

  it('records a status change with the acting operator and a timestamp', async () => {
    const list = await admin(ORIGIN_A, '/bookings?limit=1');
    const id = list.body.bookings[0].id;

    const detail = await admin(ORIGIN_A, `/bookings/${encodeURIComponent(id)}`);
    expect(Array.isArray(detail.body.history)).toBe(true);
    expect(Array.isArray(detail.body.notifications)).toBe(true);

    const next = detail.body.booking.status === 'new' ? 'quoted' : 'new';
    const change = await admin(ORIGIN_A, `/bookings/${encodeURIComponent(id)}/status`, {
      method: 'POST',
      body: JSON.stringify({ status: next })
    });
    expect(change.status).toBe(200);

    const after = await admin(ORIGIN_A, `/bookings/${encodeURIComponent(id)}`);
    const last = after.body.history.at(-1);
    expect(last.actor).toBe('dev-bypass@localhost');
    expect(last.created_at).toBeTruthy();
  });

  it('rejects an unknown status', async () => {
    const list = await admin(ORIGIN_A, '/bookings?limit=1');
    const id = list.body.bookings[0].id;
    const change = await admin(ORIGIN_A, `/bookings/${encodeURIComponent(id)}/status`, {
      method: 'POST',
      body: JSON.stringify({ status: 'not-a-status' })
    });
    expect(change.status).toBe(422);
  });
});

describe('database failure behaviour', () => {
  beforeAll(async () => {
    // Deliberately unmigrated: `bookings` does not exist, so the D1 batch throws
    // a driver error rather than an ApiError.
    workerB = await startWorker({ port: PORT_B, migrate: false });
  }, 180_000);

  it('returns a clean 500 instead of crashing or leaking the driver error', async () => {
    const result = await post(ORIGIN_B, '10.20.0.1', validPayload());
    expect(result.status).toBe(500);
    expect(result.body?.error?.code).toBe('internal_error');
    // The message must be generic — a raw SQLite error would leak schema detail.
    expect(result.body?.error?.message).toBe('The request could not be processed.');
    expect(JSON.stringify(result.body)).not.toMatch(/SQLITE|no such table|D1_ERROR/i);
  });

  it('still answers the health endpoint when the database is unusable', async () => {
    // Health must not depend on D1, or a database problem would look like a
    // total outage and take the whole site out of rotation.
    const response = await fetch(`${ORIGIN_B}/api/health`);
    expect(response.status).toBe(200);
  });
});
