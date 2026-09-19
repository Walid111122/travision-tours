/**
 * Shared HTTP primitives for the Worker API.
 *
 * `ApiError` carries a machine-readable code and an HTTP status so the route
 * handlers can fail without ever leaking a stack trace to the client.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly headers?: Record<string, string>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'no-store');
  return new Response(JSON.stringify(data), { ...init, headers });
}

/** Serialise an unexpected error for logs without exposing it to the client. */
export function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
