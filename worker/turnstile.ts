import { ApiError } from './http';

const VERIFY_ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export type TurnstileEnv = {
  ENVIRONMENT?: string;
  TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_DEV_BYPASS?: string;
};

/**
 * Local-development bypass.
 *
 * It can only activate when BOTH conditions hold, so it cannot fire
 * accidentally in production even if a stray flag is left behind:
 *   - `ENVIRONMENT` is exactly `development` (not merely "not production"), and
 *   - `TURNSTILE_DEV_BYPASS` is exactly `true`.
 *
 * Production configuration must never set `TURNSTILE_DEV_BYPASS`.
 */
export function isTurnstileBypassed(env: TurnstileEnv): boolean {
  return env.ENVIRONMENT === 'development' && env.TURNSTILE_DEV_BYPASS === 'true';
}

type SiteVerifyResponse = {
  success?: boolean;
  'error-codes'?: string[];
};

/**
 * Verify a Turnstile token server-side before the inquiry is stored.
 *
 * Fails closed: if no secret is configured in production, the submission is
 * rejected rather than silently accepted.
 */
export async function verifyTurnstile(
  token: string | undefined,
  remoteIp: string | undefined,
  env: TurnstileEnv,
  idempotencyKey?: string
): Promise<void> {
  if (isTurnstileBypassed(env)) {
    console.warn(
      JSON.stringify({ message: 'turnstile_bypassed', environment: env.ENVIRONMENT })
    );
    return;
  }

  const secret = env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error(
      JSON.stringify({
        message: 'turnstile_secret_missing',
        environment: env.ENVIRONMENT
      })
    );
    throw new ApiError(
      503,
      'abuse_protection_unavailable',
      'We could not verify your submission right now. Please try again shortly.'
    );
  }

  if (!token) {
    throw new ApiError(
      422,
      'turnstile_required',
      'Complete the anti-bot check and try again.'
    );
  }

  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (remoteIp) body.append('remoteip', remoteIp);
  // Cloudflare accepts an idempotency key for safe Siteverify retries.
  if (idempotencyKey) body.append('idempotency_key', idempotencyKey);

  let outcome: SiteVerifyResponse;
  try {
    const response = await fetch(VERIFY_ENDPOINT, { method: 'POST', body });
    outcome = (await response.json()) as SiteVerifyResponse;
  } catch {
    throw new ApiError(
      503,
      'abuse_protection_unavailable',
      'We could not verify your submission right now. Please try again shortly.'
    );
  }

  if (!outcome?.success) {
    console.warn(
      JSON.stringify({
        message: 'turnstile_rejected',
        codes: outcome?.['error-codes'] ?? []
      })
    );
    throw new ApiError(
      422,
      'turnstile_failed',
      'The anti-bot check failed. Please reload the page and try again.'
    );
  }
}
