/**
 * Phase 3 unit checks.
 *
 * The local dev server runs with Turnstile and Access bypassed, so the
 * production behaviour of those two boundaries — and the guarantee that the
 * bypasses cannot activate in production — is verified here instead.
 *
 * Run with: npx tsx scripts/phase3-unit.ts
 */

import { ApiError } from '../worker/http';
import { verifyTurnstile, isTurnstileBypassed } from '../worker/turnstile';
import { requireAccessIdentity } from '../worker/access';
import {
  isExactCalendarDate,
  parseChildAges,
  parseIdempotencyKey,
  parsePhone,
  parseEmail,
  boundedInteger
} from '../worker/validation';
import { validateBooking } from '../worker/booking';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail = '') {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function expectApiError(
  action: () => Promise<unknown>,
  _expectedStatus: number,
  _expectedCode: string
): Promise<{ status: number; code: string }> {
  try {
    await action();
    return { status: 0, code: 'NO_ERROR_THROWN' };
  } catch (error) {
    if (error instanceof ApiError) {
      return { status: error.status, code: error.code };
    }
    return { status: -1, code: error instanceof Error ? error.message : 'unknown' };
  }
}

function capture(action: () => unknown): string {
  try {
    action();
    return 'NO_ERROR_THROWN';
  } catch (error) {
    return error instanceof ApiError ? error.code : 'NOT_API_ERROR';
  }
}

async function run() {
  console.log('\n=== Turnstile: fail-closed in production ===');

  let outcome = await expectApiError(
    () => verifyTurnstile(undefined, undefined, { ENVIRONMENT: 'production' }),
    503,
    'abuse_protection_unavailable'
  );
  check(
    'production without a secret fails closed',
    outcome.status === 503 && outcome.code === 'abuse_protection_unavailable',
    JSON.stringify(outcome)
  );

  outcome = await expectApiError(
    () =>
      verifyTurnstile(undefined, undefined, {
        ENVIRONMENT: 'production',
        TURNSTILE_SECRET_KEY: 'secret',
        TURNSTILE_DEV_BYPASS: 'true'
      }),
    422,
    'turnstile_required'
  );
  check(
    'production rejects a missing token even when the bypass flag is present',
    outcome.code === 'turnstile_required',
    JSON.stringify(outcome)
  );

  check(
    'bypass cannot activate in production',
    isTurnstileBypassed({ ENVIRONMENT: 'production', TURNSTILE_DEV_BYPASS: 'true' }) === false
  );

  check(
    'bypass requires the explicit flag',
    isTurnstileBypassed({ ENVIRONMENT: 'development' }) === false
  );

  check(
    'bypass activates only in development with the flag',
    isTurnstileBypassed({ ENVIRONMENT: 'development', TURNSTILE_DEV_BYPASS: 'true' }) === true
  );

  const bypassed = await verifyTurnstile(undefined, undefined, {
      ENVIRONMENT: 'development',
      TURNSTILE_DEV_BYPASS: 'true'
    }).then(() => true, () => false);
  check('documented development bypass allows submission without a token', bypassed);

  console.log('\n=== Cloudflare Access: no public enumeration ===');

  const bare = new Request('https://example.com/api/admin/bookings');

  outcome = await expectApiError(
    () => requireAccessIdentity(bare, { ENVIRONMENT: 'production' }),
    503,
    'access_not_configured'
  );
  check(
    'unconfigured Access fails closed',
    outcome.code === 'access_not_configured',
    JSON.stringify(outcome)
  );

  outcome = await expectApiError(
    () =>
      requireAccessIdentity(bare, {
        ENVIRONMENT: 'production',
        ACCESS_TEAM_DOMAIN: 'team.cloudflareaccess.com',
        ACCESS_AUD: 'aud-tag',
        ACCESS_DEV_BYPASS: 'true'
      }),
    403,
    'access_denied'
  );
  check(
    'production denies an anonymous request even when the bypass flag is present',
    outcome.code === 'access_denied',
    JSON.stringify(outcome)
  );

  const malformed = new Request('https://example.com/api/admin/bookings', {
    headers: { 'Cf-Access-Jwt-Assertion': 'not.a.jwt' }
  });
  outcome = await expectApiError(
    () =>
      requireAccessIdentity(malformed, {
        ENVIRONMENT: 'production',
        ACCESS_TEAM_DOMAIN: 'team.cloudflareaccess.com',
        ACCESS_AUD: 'aud-tag'
      }),
    403,
    'access_denied'
  );
  check(
    'a forged JWT cannot be decoded into an identity',
    outcome.code === 'access_denied',
    JSON.stringify(outcome)
  );

  const identity = await requireAccessIdentity(bare, {
      ENVIRONMENT: 'development',
      ACCESS_DEV_BYPASS: 'true'
    }).catch(() => null);
  check(
    'documented development bypass returns a local identity',
    identity?.email === 'dev-bypass@localhost',
    JSON.stringify(identity)
  );

  console.log('\n=== Exact calendar dates ===');

  check('2026-02-31 is not a real date', isExactCalendarDate('2026-02-31') === false);
  check('2026-04-31 is not a real date', isExactCalendarDate('2026-04-31') === false);
  check('2026-13-01 is not a real month', isExactCalendarDate('2026-13-01') === false);
  check('2026-00-10 is not a real month', isExactCalendarDate('2026-00-10') === false);
  check('2026-01-00 is not a real day', isExactCalendarDate('2026-01-00') === false);
  check('2024-02-29 is a leap day', isExactCalendarDate('2024-02-29') === true);
  check('2026-02-29 is not a leap day', isExactCalendarDate('2026-02-29') === false);
  check('2026-12-31 is valid', isExactCalendarDate('2026-12-31') === true);
  check('non-padded input is rejected', isExactCalendarDate('2026-1-1') === false);

  console.log('\n=== Phone, email and age boundaries ===');

  check('6-digit phone rejected', capture(() => parsePhone('123456')) === 'validation_error');
  check('7-digit phone accepted', capture(() => parsePhone('1234567')) === 'NO_ERROR_THROWN');
  check('15-digit phone accepted', capture(() => parsePhone('+123456789012345')) === 'NO_ERROR_THROWN');
  check('16-digit phone rejected', capture(() => parsePhone('+1234567890123456')) === 'validation_error');
  check(
    'punctuation and a leading + are accepted',
    capture(() => parsePhone('+1 (202) 555-0143')) === 'NO_ERROR_THROWN'
  );
  check('letters are rejected', capture(() => parsePhone('+1 202 ABC 0143')) === 'validation_error');
  check(
    'a + anywhere but the front is rejected',
    capture(() => parsePhone('1+2025550143')) === 'validation_error'
  );

  check('email over 254 characters rejected', capture(() => parseEmail(`${'a'.repeat(250)}@x.com`)) === 'validation_error');
  check('email without a domain rejected', capture(() => parseEmail('walid@')) === 'validation_error');

  check('zero children accepts no ages', capture(() => parseChildAges(undefined, 0)) === 'NO_ERROR_THROWN');
  check('zero children rejects stray ages', capture(() => parseChildAges('5', 0)) === 'validation_error');
  check('two children accept two ages', capture(() => parseChildAges('6, 10', 2)) === 'NO_ERROR_THROWN');
  check('two children reject one age', capture(() => parseChildAges('6', 2)) === 'validation_error');
  check('two children reject three ages', capture(() => parseChildAges('6, 10, 12', 2)) === 'validation_error');
  check('age 17 is accepted', capture(() => parseChildAges('17', 1)) === 'NO_ERROR_THROWN');
  check('age 18 is rejected', capture(() => parseChildAges('18', 1)) === 'validation_error');

  check(
    'integer bounds are enforced at the edge',
    capture(() => boundedInteger(51, 'Adults', 1, 50)) === 'validation_error' &&
      capture(() => boundedInteger(1, 'Adults', 1, 50)) === 'NO_ERROR_THROWN'
  );

  console.log('\n=== Submission keys ===');

  check(
    'a v4 UUID is accepted',
    capture(() => parseIdempotencyKey('123e4567-e89b-42d3-a456-426614174000')) === 'NO_ERROR_THROWN'
  );
  check('a non-UUID key is rejected', capture(() => parseIdempotencyKey('abc')) === 'validation_error');
  check('an over-length key is rejected', capture(() => parseIdempotencyKey('a'.repeat(80))) === 'validation_error');

  console.log('\n=== Canonical tour resolution ===');

  const base = {
    name: 'Test',
    email: 'test@example.com',
    phone: '+201028838866',
    preferredDate: '2027-06-10',
    adults: 1,
    children: 0,
    travelers: 1,
    partnerPaymentAcknowledged: true
  };

  check(
    'an unknown tour ID is rejected',
    capture(() => validateBooking({ ...base, tourId: 'nope' })) === 'unknown_tour'
  );
  check(
    'the planner source does not require a tour ID',
    capture(() => validateBooking({ ...base, source: 'planner', itineraryStopIds: ['1'] })) ===
      'NO_ERROR_THROWN'
  );

  const resolved = validateBooking({
    ...base,
    tourId: 'cairo-day-tour',
    tourTitle: 'Spoofed title'
  });
  check('the stored title comes from the catalog', resolved.tourTitle === 'Cairo Day Tour', resolved.tourTitle);

  const now = new Date('2026-09-14T12:00:00Z');
  check(
    'a past preferred date is rejected',
    capture(() => validateBooking({ ...base, tourId: 'cairo-day-tour', preferredDate: '2026-01-01' }, now)) ===
      'validation_error'
  );
  check(
    'a future preferred date is accepted',
    capture(() => validateBooking({ ...base, tourId: 'cairo-day-tour', preferredDate: '2026-10-01' }, now)) ===
      'NO_ERROR_THROWN'
  );

  console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
  process.exitCode = failed === 0 ? 0 : 1;
}

run().catch(error => {
  console.error('Unit run crashed:', error);
  process.exitCode = 2;
});
