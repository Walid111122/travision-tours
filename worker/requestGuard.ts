import { ApiError } from './http';

/**
 * CSRF / cross-site guard for state-changing admin requests.
 *
 * The admin API is browser-only and same-origin. A cross-site form or fetch
 * cannot produce `Sec-Fetch-Site: same-origin`, and the browser always sends
 * `Origin` on a cross-origin POST — so any request that proves itself foreign
 * is refused before a handler runs. Requests with neither header (curl,
 * wrangler tests) are allowed through: they still face Access JWT validation,
 * which is the real authentication boundary.
 */
export function enforceSameOriginMutation(request: Request): void {
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return;

  const fetchSite = request.headers.get('Sec-Fetch-Site');
  if (fetchSite && !['same-origin', 'same-site', 'none'].includes(fetchSite.toLowerCase())) {
    throw new ApiError(403, 'cross_site_request', 'Cross-site requests are not accepted here.');
  }

  const origin = request.headers.get('Origin');
  if (origin) {
    let same: boolean;
    try {
      same = new URL(origin).origin === new URL(request.url).origin;
    } catch {
      same = false;
    }
    if (!same) {
      throw new ApiError(403, 'cross_site_request', 'Cross-site requests are not accepted here.');
    }
  }
}
