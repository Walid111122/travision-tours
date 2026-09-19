import { describe, expect, it } from 'vitest';
import { ApiError } from '../../worker/http';
import { isTurnstileBypassed, verifyTurnstile } from '../../worker/turnstile';
import { isAccessBypassed, requireAccessIdentity } from '../../worker/access';
import { enforceSameOriginMutation } from '../../worker/requestGuard';

/**
 * Security boundaries that the local dev server cannot exercise.
 *
 * `wrangler dev` runs with Turnstile and Cloudflare Access bypassed, so the
 * production behaviour of both — and the guarantee that neither bypass can
 * activate outside development — is asserted here instead.
 *
 * These are the highest-consequence tests in the suite: if either bypass leaked
 * into production, the inquiry form would be open to automated spam and the
 * operator lead list would be publicly enumerable.
 */

/** The `ApiError` status and code a call throws. */
async function errorOf(action: () => Promise<unknown>): Promise<{ status: number; code: string }> {
  try {
    await action();
    return { status: 0, code: 'NO_ERROR_THROWN' };
  } catch (error) {
    if (error instanceof ApiError) return { status: error.status, code: error.code };
    return { status: -1, code: error instanceof Error ? error.message : 'unknown' };
  }
}

describe('Turnstile fails closed', () => {
  it('rejects a submission in production when no secret is configured', async () => {
    const outcome = await errorOf(() =>
      verifyTurnstile(undefined, undefined, { ENVIRONMENT: 'production' })
    );
    expect(outcome).toEqual({ status: 503, code: 'abuse_protection_unavailable' });
  });

  it('still requires a token in production even when the bypass flag is present', async () => {
    const outcome = await errorOf(() =>
      verifyTurnstile(undefined, undefined, {
        ENVIRONMENT: 'production',
        TURNSTILE_SECRET_KEY: 'secret',
        TURNSTILE_DEV_BYPASS: 'true'
      })
    );
    expect(outcome.code).toBe('turnstile_required');
  });
});

describe('Turnstile development bypass', () => {
  it('cannot activate in production', () => {
    expect(isTurnstileBypassed({ ENVIRONMENT: 'production', TURNSTILE_DEV_BYPASS: 'true' })).toBe(
      false
    );
  });

  it('cannot activate from the flag alone', () => {
    expect(isTurnstileBypassed({ TURNSTILE_DEV_BYPASS: 'true' })).toBe(false);
  });

  it('cannot activate from the environment alone', () => {
    expect(isTurnstileBypassed({ ENVIRONMENT: 'development' })).toBe(false);
  });

  it('requires the exact string "true", not any truthy value', () => {
    expect(isTurnstileBypassed({ ENVIRONMENT: 'development', TURNSTILE_DEV_BYPASS: '1' })).toBe(
      false
    );
    expect(isTurnstileBypassed({ ENVIRONMENT: 'development', TURNSTILE_DEV_BYPASS: 'TRUE' })).toBe(
      false
    );
  });

  it('activates only in development with the flag', () => {
    expect(isTurnstileBypassed({ ENVIRONMENT: 'development', TURNSTILE_DEV_BYPASS: 'true' })).toBe(
      true
    );
  });

  it('lets a documented development submission through without a token', async () => {
    await expect(
      verifyTurnstile(undefined, undefined, {
        ENVIRONMENT: 'development',
        TURNSTILE_DEV_BYPASS: 'true'
      })
    ).resolves.toBeUndefined();
  });
});

describe('Cloudflare Access fails closed', () => {
  const anonymous = new Request('https://example.com/api/admin/bookings');

  it('rejects an unconfigured deployment', async () => {
    const outcome = await errorOf(() =>
      requireAccessIdentity(anonymous, { ENVIRONMENT: 'production' })
    );
    expect(outcome.code).toBe('access_not_configured');
    expect(outcome.status).toBe(503);
  });

  it('denies an anonymous production request even with the bypass flag set', async () => {
    const outcome = await errorOf(() =>
      requireAccessIdentity(anonymous, {
        ENVIRONMENT: 'production',
        ACCESS_TEAM_DOMAIN: 'team.cloudflareaccess.com',
        ACCESS_AUD: 'aud-tag',
        ACCESS_DEV_BYPASS: 'true'
      })
    );
    expect(outcome).toEqual({ status: 403, code: 'access_denied' });
  });

  it('cannot decode a forged JWT into an identity', async () => {
    const forged = new Request('https://example.com/api/admin/bookings', {
      headers: { 'Cf-Access-Jwt-Assertion': 'not.a.jwt' }
    });
    const outcome = await errorOf(() =>
      requireAccessIdentity(forged, {
        ENVIRONMENT: 'production',
        ACCESS_TEAM_DOMAIN: 'team.cloudflareaccess.com',
        ACCESS_AUD: 'aud-tag'
      })
    );
    expect(outcome.code).toBe('access_denied');
  });

  it('returns a local identity under the documented development bypass', async () => {
    const identity = await requireAccessIdentity(anonymous, {
      ENVIRONMENT: 'development',
      ACCESS_DEV_BYPASS: 'true'
    });
    expect(identity.email).toBe('dev-bypass@localhost');
  });
});

describe('Access development-bypass isolation', () => {
  it('cannot activate in production', () => {
    expect(isAccessBypassed({ ENVIRONMENT: 'production', ACCESS_DEV_BYPASS: 'true' })).toBe(false);
  });

  it('cannot activate from the flag alone', () => {
    expect(isAccessBypassed({ ACCESS_DEV_BYPASS: 'true' })).toBe(false);
  });

  it('cannot activate from the environment alone', () => {
    expect(isAccessBypassed({ ENVIRONMENT: 'development' })).toBe(false);
  });

  it('requires the exact string "true"', () => {
    expect(isAccessBypassed({ ENVIRONMENT: 'development', ACCESS_DEV_BYPASS: '1' })).toBe(false);
    expect(isAccessBypassed({ ENVIRONMENT: 'development', ACCESS_DEV_BYPASS: 'TRUE' })).toBe(false);
  });

  it('ignores request-supplied bypass attempts entirely', async () => {
    // No query param, header or cookie can ever satisfy the check — it reads
    // environment config only.
    const sneaky = new Request('https://example.com/api/admin/bookings?dev_bypass=true', {
      headers: { 'X-Dev-Bypass': 'true', Cookie: 'ACCESS_DEV_BYPASS=true' }
    });
    const outcome = await errorOf(() =>
      requireAccessIdentity(sneaky, {
        ENVIRONMENT: 'production',
        ACCESS_TEAM_DOMAIN: 'team.cloudflareaccess.com',
        ACCESS_AUD: 'aud'
      })
    );
    expect(outcome).toEqual({ status: 403, code: 'access_denied' });
  });
});

describe('same-origin mutation guard', () => {
  const url = 'https://example.com/api/admin/tours/x/status';

  it('allows GET/HEAD through untouched', () => {
    expect(() => enforceSameOriginMutation(new Request(url))).not.toThrow();
  });

  it('allows a same-origin POST', () => {
    const request = new Request(url, {
      method: 'POST',
      headers: { Origin: 'https://example.com', 'Sec-Fetch-Site': 'same-origin' }
    });
    expect(() => enforceSameOriginMutation(request)).not.toThrow();
  });

  it('rejects a cross-origin POST', () => {
    const request = new Request(url, {
      method: 'POST',
      headers: { Origin: 'https://evil.example', 'Sec-Fetch-Site': 'cross-site' }
    });
    expect(() => enforceSameOriginMutation(request)).toThrowError(ApiError);
  });

  it('rejects a foreign Sec-Fetch-Site even without Origin', () => {
    const request = new Request(url, {
      method: 'POST',
      headers: { 'Sec-Fetch-Site': 'cross-site' }
    });
    expect(() => enforceSameOriginMutation(request)).toThrowError(ApiError);
  });

  it('rejects a mismatched Origin on a DELETE', () => {
    const request = new Request(url, {
      method: 'DELETE',
      headers: { Origin: 'https://evil.example' }
    });
    expect(() => enforceSameOriginMutation(request)).toThrowError(ApiError);
  });
});
