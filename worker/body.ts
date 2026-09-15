import { ApiError } from './http';

export const MAX_BODY_BYTES = 16 * 1024;

/**
 * Read a JSON body with an enforced size ceiling and a content-type check.
 *
 * `Content-Length` is only a hint — it can be absent or wrong — so the stream
 * is also counted while it is read and cancelled the moment it exceeds the
 * limit.
 */
export async function readBoundedJson(request: Request): Promise<unknown> {
  const contentType = request.headers.get('Content-Type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new ApiError(415, 'unsupported_media_type', 'Content-Type must be application/json.');
  }

  const declaredLength = Number(request.headers.get('Content-Length') || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    throw new ApiError(413, 'payload_too_large', 'Request body is too large.');
  }

  if (!request.body) {
    throw new ApiError(400, 'invalid_request', 'A request body is required.');
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new ApiError(413, 'payload_too_large', 'Request body is too large.');
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new ApiError(400, 'invalid_json', 'Request body must contain valid JSON.');
  }
}
