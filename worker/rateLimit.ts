import { ApiError } from './http';

const DEFAULT_WINDOW_SECONDS = 600;
const DEFAULT_MAX_REQUESTS = 5;

export type RateLimitEnv = {
  DB: D1Database;
  RATE_LIMIT_SALT?: string;
  RATE_LIMIT_WINDOW_SECONDS?: string;
  RATE_LIMIT_MAX_REQUESTS?: string;
};

async function hashIdentifier(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

/**
 * Sliding-window throttle backed by D1.
 *
 * This is the reviewed fallback for plans without a Cloudflare-native rate
 * limiting rule. Two properties matter:
 *   - the client address is hashed together with a deployment salt, so the
 *     table never stores a raw IP address; and
 *   - counters are scoped to a fixed window and purged by the scheduled
 *     handler, so nothing is retained indefinitely.
 */
export async function enforceRateLimit(env: RateLimitEnv, request: Request): Promise<void> {
  const windowSeconds = positiveInt(env.RATE_LIMIT_WINDOW_SECONDS, DEFAULT_WINDOW_SECONDS);
  const maxRequests = positiveInt(env.RATE_LIMIT_MAX_REQUESTS, DEFAULT_MAX_REQUESTS);

  const clientAddress = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const keyHash = await hashIdentifier(
    `${env.RATE_LIMIT_SALT ?? 'travision-tours'}:${clientAddress}`
  );
  const windowStart = Math.floor(Date.now() / 1000 / windowSeconds) * windowSeconds;
  const now = new Date().toISOString();

  await env.DB.prepare(`
    INSERT INTO rate_limit_counters (key_hash, window_start, count, updated_at)
    VALUES (?, ?, 1, ?)
    ON CONFLICT (key_hash, window_start)
    DO UPDATE SET count = count + 1, updated_at = excluded.updated_at
  `)
    .bind(keyHash, windowStart, now)
    .run();

  const row = await env.DB.prepare(
    'SELECT count FROM rate_limit_counters WHERE key_hash = ? AND window_start = ?'
  )
    .bind(keyHash, windowStart)
    .first<{ count: number }>();

  if ((row?.count ?? 0) > maxRequests) {
    const retryAfterSeconds = Math.max(
      windowStart + windowSeconds - Math.floor(Date.now() / 1000),
      1
    );
    throw new ApiError(
      429,
      'rate_limited',
      'Too many requests from this connection. Please wait a few minutes and try again.',
      { 'Retry-After': String(retryAfterSeconds) }
    );
  }
}

/** Drop counters whose window has expired. Called from the scheduled handler. */
export async function purgeExpiredRateLimitCounters(
  env: RateLimitEnv,
  retentionSeconds: number
): Promise<void> {
  const cutoff = Math.floor(Date.now() / 1000) - retentionSeconds;
  await env.DB.prepare('DELETE FROM rate_limit_counters WHERE window_start < ?')
    .bind(cutoff)
    .run();
}
