import { ApiError } from './http';

const KEY_CACHE_MS = 60 * 60 * 1000;

export type AccessEnv = {
  ENVIRONMENT?: string;
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
  ACCESS_ALLOWED_EMAILS?: string;
  ACCESS_DEV_BYPASS?: string;
};

export type AccessIdentity = {
  email: string;
};

type AccessKey = JsonWebKey & { kid?: string };

let cachedKeys: { fetchedAt: number; keys: AccessKey[] } | null = null;

function base64UrlDecode(value: string): Uint8Array {
  const padded = value
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function getAccessKeys(teamDomain: string): Promise<AccessKey[]> {
  const now = Date.now();
  if (cachedKeys && now - cachedKeys.fetchedAt < KEY_CACHE_MS) {
    return cachedKeys.keys;
  }

  const response = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
  if (!response.ok) {
    throw new ApiError(
      503,
      'access_verification_unavailable',
      'Operator access could not be verified right now.'
    );
  }

  const body = (await response.json()) as { keys?: AccessKey[] };
  cachedKeys = { fetchedAt: now, keys: body.keys ?? [] };
  return cachedKeys.keys;
}

function deny(): never {
  throw new ApiError(403, 'access_denied', 'Operator access is required.');
}

/**
 * Verify a Cloudflare Access identity for the protected lead-review routes.
 *
 * Access is the front door, but the Worker still validates the signed JWT —
 * the header alone is never trusted, and the endpoint is never public.
 *
 * The development bypass mirrors Turnstile's: it requires `ENVIRONMENT` to be
 * exactly `development` AND `ACCESS_DEV_BYPASS` to be exactly `true`, so it
 * cannot activate accidentally in production.
 */
/**
 * True only when the development bypass is active — both conditions, exact
 * strings. The admin session endpoint reports this so the dashboard can show
 * its "LOCAL DEVELOPMENT AUTH BYPASS" banner, and tests assert it cannot be
 * true in production.
 */
export function isAccessBypassed(env: AccessEnv): boolean {
  return env.ENVIRONMENT === 'development' && env.ACCESS_DEV_BYPASS === 'true';
}

export async function requireAccessIdentity(
  request: Request,
  env: AccessEnv
): Promise<AccessIdentity> {
  if (isAccessBypassed(env)) {
    console.warn(
      JSON.stringify({ message: 'access_bypassed', environment: env.ENVIRONMENT })
    );
    return { email: 'dev-bypass@localhost' };
  }

  const teamDomain = env.ACCESS_TEAM_DOMAIN;
  const audience = env.ACCESS_AUD;
  if (!teamDomain || !audience) {
    throw new ApiError(
      503,
      'access_not_configured',
      'Operator access is not configured for this environment.'
    );
  }

  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) deny();

  const segments = token.split('.');
  if (segments.length !== 3) deny();
  const [headerPart, payloadPart, signaturePart] = segments;

  let header: { kid?: string; alg?: string };
  let payload: {
    aud?: string | string[];
    iss?: string;
    exp?: number;
    email?: string;
  };
  try {
    header = JSON.parse(new TextDecoder().decode(base64UrlDecode(headerPart)));
    payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadPart)));
  } catch {
    deny();
  }

  if (header.alg !== 'RS256' || !header.kid) deny();

  const keys = await getAccessKeys(teamDomain);
  const jwk = keys.find(key => key.kid === header.kid);
  if (!jwk) deny();

  let valid = false;
  try {
    const key = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );
    valid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      base64UrlDecode(signaturePart),
      new TextEncoder().encode(`${headerPart}.${payloadPart}`)
    );
  } catch {
    deny();
  }
  if (!valid) deny();

  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audiences.includes(audience)) deny();
  if (payload.iss !== `https://${teamDomain}`) deny();
  if (!payload.exp || payload.exp * 1000 <= Date.now()) deny();

  const email = (payload.email ?? '').toLowerCase();
  const allowed = (env.ACCESS_ALLOWED_EMAILS ?? '')
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);

  if (allowed.length > 0 && !allowed.includes(email)) deny();

  return { email };
}
