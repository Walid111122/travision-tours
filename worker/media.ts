import { ApiError, json } from './http';
import { boundedInteger, optionalString } from './validation';
import { auditStatement } from './audit';

/**
 * Media library.
 *
 * Uploads are validated by *signature*, not extension: the MIME whitelist is
 * confirmed against magic bytes, dimensions are parsed from the image header,
 * and the object key is generated server-side so no client string ever
 * reaches storage. SVG is not in the whitelist (scriptable markup), and
 * anything that is not a raster image is rejected.
 *
 * Objects are never hard-deleted — referenced media cannot be removed at all;
 * unused media is archived. In production the bytes live in the MEDIA R2
 * binding (bucket creation is a domain-phase task); in development wrangler
 * emulates R2 locally.
 */

export type MediaEnv = {
  DB: D1Database;
  MEDIA?: R2Bucket;
};

const MAX_PAGE = 200;
const DEFAULT_PAGE = 50;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const ALLOWED_MIME: Record<string, { ext: string; label: string }> = {
  'image/jpeg': { ext: 'jpg', label: 'JPEG' },
  'image/png': { ext: 'png', label: 'PNG' },
  'image/webp': { ext: 'webp', label: 'WebP' }
};

type Dimensions = { width: number; height: number } | null;

function sniffMime(bytes: Uint8Array): string | null {
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

function pngDimensions(bytes: Uint8Array): Dimensions {
  if (bytes.length < 24) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

function jpegDimensions(bytes: Uint8Array): Dimensions {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) { offset += 1; continue; }
    const marker = bytes[offset + 1];
    // SOF0–SOF15 except DHT/DAC/RST carry the frame size.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { width: view.getUint16(offset + 7), height: view.getUint16(offset + 5) };
    }
    const length = view.getUint16(offset + 2);
    offset += 2 + length;
  }
  return null;
}

function webpDimensions(bytes: Uint8Array): Dimensions {
  if (bytes.length < 30) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const chunk = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
  if (chunk === 'VP8 ' && bytes.length >= 30) {
    return { width: view.getUint16(26, true) & 0x3fff, height: view.getUint16(28, true) & 0x3fff };
  }
  if (chunk === 'VP8L' && bytes.length >= 25) {
    const b = bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24);
    return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
  }
  if (chunk === 'VP8X' && bytes.length >= 30) {
    const width = (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16)) + 1;
    const height = (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16)) + 1;
    return { width, height };
  }
  return null;
}

function imageDimensions(mime: string, bytes: Uint8Array): Dimensions {
  if (mime === 'image/png') return pngDimensions(bytes);
  if (mime === 'image/jpeg') return jpegDimensions(bytes);
  if (mime === 'image/webp') return webpDimensions(bytes);
  return null;
}

async function readRawBody(request: Request, maxBytes: number): Promise<Uint8Array> {
  const declared = Number(request.headers.get('Content-Length') || 0);
  if (declared > maxBytes) {
    throw new ApiError(413, 'payload_too_large', 'File exceeds the 8 MB limit.');
  }
  if (!request.body) throw new ApiError(400, 'invalid_request', 'A request body is required.');

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      throw new ApiError(413, 'payload_too_large', 'File exceeds the 8 MB limit.');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

type MediaRow = {
  id: string;
  object_key: string;
  filename: string;
  mime: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt: string;
  status: string;
  created_by: string;
  created_at: string;
  archived_at: string | null;
};

async function listMedia(env: MediaEnv, url: URL): Promise<Response> {
  const status = optionalString(url.searchParams.get('status'), 'Status', 20);
  if (status && !['active', 'archived'].includes(status)) {
    throw new ApiError(422, 'validation_error', 'Unknown media status filter.');
  }
  const q = optionalString(url.searchParams.get('q'), 'Search', 120);
  const limit = boundedInteger(Number(url.searchParams.get('limit') ?? DEFAULT_PAGE), 'Limit', 1, MAX_PAGE);
  const offset = boundedInteger(Number(url.searchParams.get('offset') ?? 0), 'Offset', 0, 100000);

  const conditions: string[] = [];
  const bindings: unknown[] = [];
  if (status) { conditions.push('status = ?'); bindings.push(status); }
  if (q) {
    conditions.push('(filename LIKE ? OR alt LIKE ?)');
    const like = `%${q.replace(/[%_]/g, '')}%`;
    bindings.push(like, like);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const count = await env.DB.prepare(`SELECT COUNT(*) AS n FROM media_assets ${where}`)
    .bind(...bindings).first<{ n: number }>();
  const { results } = await env.DB.prepare(`
    SELECT * FROM media_assets ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).bind(...bindings, limit, offset).all<MediaRow>();

  const assets = (results ?? []).map(row => ({
    ...row,
    url: `/api/admin/media/${row.id}/file`
  }));
  return json({ media: assets, total: count?.n ?? 0 });
}

async function uploadMedia(env: MediaEnv, request: Request, actor: string): Promise<Response> {
  if (!env.MEDIA) {
    throw new ApiError(
      503,
      'media_storage_not_configured',
      'Media storage is not bound in this environment.'
    );
  }
  const url = new URL(request.url);
  const filename = optionalString(url.searchParams.get('filename'), 'Filename', 200) ?? 'image';
  const alt = optionalString(url.searchParams.get('alt'), 'Alt text', 300);
  if (!alt) {
    throw new ApiError(422, 'validation_error', 'Alt text is required for every uploaded image.');
  }

  const bytes = await readRawBody(request, MAX_IMAGE_BYTES);
  const detected = sniffMime(bytes);
  if (!detected) {
    throw new ApiError(
      422,
      'unsupported_media',
      'Only JPEG, PNG or WebP images are accepted — the file signature did not match an allowed image type.'
    );
  }
  const declared = (request.headers.get('Content-Type') ?? '').split(';')[0].trim().toLowerCase();
  if (declared && declared !== detected) {
    throw new ApiError(
      422,
      'mime_mismatch',
      `The file is actually ${ALLOWED_MIME[detected].label}, not the declared ${declared}.`
    );
  }
  const dims = imageDimensions(detected, bytes);
  if (!dims || dims.width < 8 || dims.height < 8) {
    throw new ApiError(422, 'invalid_image', 'The image dimensions could not be verified.');
  }

  const id = crypto.randomUUID();
  const key = `media/${id}.${ALLOWED_MIME[detected].ext}`;
  const now = new Date().toISOString();

  await env.MEDIA.put(key, bytes, {
    httpMetadata: { contentType: detected },
    customMetadata: { alt, uploadedBy: actor, originalName: filename.slice(0, 200) }
  });

  await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO media_assets (id, object_key, filename, mime, size_bytes, width, height, alt, status, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
    `).bind(id, key, filename.slice(0, 200), detected, bytes.byteLength, dims.width, dims.height, alt, actor, now),
    auditStatement(env, actor, 'media.upload', 'media', id, `${filename} (${detected}, ${bytes.byteLength} B)`, now)
  ]);

  return json({ media: { id, object_key: key, url: `/api/admin/media/${id}/file` } }, { status: 201 });
}

async function serveMediaFile(env: MediaEnv, id: string): Promise<Response> {
  if (!env.MEDIA) {
    throw new ApiError(503, 'media_storage_not_configured', 'Media storage is not bound here.');
  }
  const row = await env.DB.prepare(
    'SELECT object_key, mime FROM media_assets WHERE id = ?'
  ).bind(id).first<{ object_key: string; mime: string }>();
  if (!row) throw new ApiError(404, 'not_found', 'No media asset matches that identifier.');

  const object = await env.MEDIA.get(row.object_key);
  if (!object) throw new ApiError(404, 'not_found', 'The stored object is missing.');

  return new Response(object.body, {
    headers: {
      'Content-Type': row.mime,
      'Cache-Control': 'private, max-age=300',
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': 'inline'
    }
  });
}

/** Where this asset is referenced — keys and filenames are matched in content columns. */
async function mediaUsage(env: MediaEnv, id: string): Promise<{ entity: string; id: string; field: string }[]> {
  const row = await env.DB.prepare('SELECT object_key, filename FROM media_assets WHERE id = ?')
    .bind(id).first<{ object_key: string; filename: string }>();
  if (!row) throw new ApiError(404, 'not_found', 'No media asset matches that identifier.');

  const needles = [row.object_key, `/api/admin/media/${id}/file`];
  const usage: { entity: string; id: string; field: string }[] = [];

  // instr(), not LIKE — D1 rejects LIKE patterns longer than ~50 bytes and the
  // serving URL needle exceeds that.
  for (const needle of needles) {
    const tours = await env.DB.prepare(`
      SELECT id, 'cover_image' AS field FROM cms_tours WHERE instr(cover_image, ?) > 0
      UNION ALL SELECT id, 'gallery' FROM cms_tours WHERE instr(gallery, ?) > 0
      UNION ALL SELECT id, 'itinerary' FROM cms_tours WHERE instr(itinerary, ?) > 0
    `).bind(needle, needle, needle).all<{ id: string; field: string }>();
    for (const hit of tours.results ?? []) usage.push({ entity: 'tour', id: hit.id, field: hit.field });

    const posts = await env.DB.prepare(`
      SELECT id, 'cover_image' AS field FROM cms_posts WHERE instr(cover_image, ?) > 0
      UNION ALL SELECT id, 'content' FROM cms_posts WHERE instr(content, ?) > 0
    `).bind(needle, needle).all<{ id: string; field: string }>();
    for (const hit of posts.results ?? []) usage.push({ entity: 'post', id: hit.id, field: hit.field });
  }
  return usage;
}

async function getMediaUsage(env: MediaEnv, id: string): Promise<Response> {
  return json({ usage: await mediaUsage(env, id) });
}

async function archiveMedia(env: MediaEnv, id: string, actor: string): Promise<Response> {
  const usage = await mediaUsage(env, id);
  if (usage.length) {
    throw new ApiError(
      409,
      'media_in_use',
      `This image is referenced by ${usage.length} content field(s) — remove the references first.`
    );
  }
  const now = new Date().toISOString();
  const result = await env.DB.prepare(
    `UPDATE media_assets SET status = 'archived', archived_at = ? WHERE id = ? AND status = 'active'`
  ).bind(now, id).run();
  if (!result.meta.changes) {
    throw new ApiError(404, 'not_found', 'No active media asset matches that identifier.');
  }
  await env.DB.batch([auditStatement(env, actor, 'media.archive', 'media', id, 'Archived.', now)]);
  return json({ media: { id, status: 'archived' } });
}

export async function handleMediaRequest(
  request: Request,
  env: MediaEnv,
  path: string,
  actor: string
): Promise<Response | null> {
  const method = request.method.toUpperCase();
  const url = new URL(request.url);

  if (path === '/media' && method === 'GET') return listMedia(env, url);
  if (path === '/media' && method === 'POST') return uploadMedia(env, request, actor);

  const fileMatch = path.match(/^\/media\/([^/]+)\/file$/);
  if (fileMatch && method === 'GET') return serveMediaFile(env, decodeURIComponent(fileMatch[1]));

  const usageMatch = path.match(/^\/media\/([^/]+)\/usage$/);
  if (usageMatch && method === 'GET') return getMediaUsage(env, decodeURIComponent(usageMatch[1]));

  const archiveMatch = path.match(/^\/media\/([^/]+)\/archive$/);
  if (archiveMatch && method === 'POST') return archiveMedia(env, decodeURIComponent(archiveMatch[1]), actor);

  return null;
}
