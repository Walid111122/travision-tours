const MAX_BODY_BYTES = 16 * 1024;

type BookingInput = {
  tourId: string;
  tourTitle: string;
  name: string;
  email: string;
  phone?: string;
  country?: string;
  preferredDate: string;
  travelers: number;
  requirements?: string;
  wireTransferAcknowledged: boolean;
};

class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message);
  }
}

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  headers.set('Cache-Control', 'no-store');
  return new Response(JSON.stringify(data), { ...init, headers });
}

async function readBoundedJson(request: Request): Promise<unknown> {
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

function requiredString(
  value: unknown,
  field: string,
  maxLength: number
): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ApiError(422, 'validation_error', `${field} is required.`);
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new ApiError(422, 'validation_error', `${field} is too long.`);
  }
  return normalized;
}

function optionalString(value: unknown, field: string, maxLength: number): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') {
    throw new ApiError(422, 'validation_error', `${field} must be text.`);
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new ApiError(422, 'validation_error', `${field} is too long.`);
  }
  return normalized || undefined;
}

function validateBooking(value: unknown): BookingInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError(422, 'validation_error', 'Booking details are required.');
  }

  const input = value as Record<string, unknown>;
  const email = requiredString(input.email, 'Email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(422, 'validation_error', 'Enter a valid email address.');
  }

  const preferredDate = requiredString(input.preferredDate, 'Preferred date', 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate) || Number.isNaN(Date.parse(`${preferredDate}T00:00:00Z`))) {
    throw new ApiError(422, 'validation_error', 'Preferred date must be a valid date.');
  }

  if (
    typeof input.travelers !== 'number' ||
    !Number.isInteger(input.travelers) ||
    input.travelers < 1 ||
    input.travelers > 50
  ) {
    throw new ApiError(422, 'validation_error', 'Travelers must be a whole number between 1 and 50.');
  }

  if (input.wireTransferAcknowledged !== true) {
    throw new ApiError(
      422,
      'wire_transfer_acknowledgement_required',
      'You must acknowledge that this is a request and payment instructions are sent separately.'
    );
  }

  return {
    tourId: requiredString(input.tourId, 'Tour', 160),
    tourTitle: requiredString(input.tourTitle, 'Tour title', 200),
    name: requiredString(input.name, 'Name', 120),
    email,
    phone: optionalString(input.phone, 'Phone', 40),
    country: optionalString(input.country, 'Country', 80),
    preferredDate,
    travelers: input.travelers,
    requirements: optionalString(input.requirements, 'Special requirements', 2000),
    wireTransferAcknowledged: true
  };
}

async function createBooking(request: Request, env: Env): Promise<Response> {
  const input = validateBooking(await readBoundedJson(request));

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const reference = `TV-${now.slice(0, 10).replaceAll('-', '')}-${id.slice(0, 8).toUpperCase()}`;

  await env.DB.batch([
    env.DB.prepare(`
      INSERT INTO bookings (
        id, reference, status, tour_id, tour_title, customer_name,
        customer_email, customer_phone, customer_country, preferred_date,
        travelers, requirements, created_at, updated_at
      ) VALUES (?, ?, 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      reference,
      input.tourId,
      input.tourTitle,
      input.name,
      input.email,
      input.phone ?? null,
      input.country ?? null,
      input.preferredDate,
      input.travelers,
      input.requirements ?? null,
      now,
      now
    ),
    env.DB.prepare(`
      INSERT INTO booking_status_history (booking_id, status, note, created_at)
      VALUES (?, 'new', 'Booking request received.', ?)
    `).bind(id, now)
  ]);

  console.log(JSON.stringify({
    message: 'booking_created',
    bookingId: id,
    reference
  }));

  return json(
    {
      booking: {
        reference,
        status: 'new'
      },
      message: 'Your request was received. It is not confirmed until Travision Tours reviews it and sends written confirmation.',
      payment: {
        method: 'wire_transfer',
        instructions: 'Wire transfer instructions will be sent privately after your request is reviewed.'
      }
    },
    { status: 201 }
  );
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === '/api/health' && request.method === 'GET') {
    return json({ status: 'ok', environment: env.ENVIRONMENT });
  }

  if (url.pathname === '/api/bookings' && request.method === 'POST') {
    return createBooking(request, env);
  }

  if (url.pathname.startsWith('/api/')) {
    return json({ error: { code: 'not_found', message: 'API route not found.' } }, { status: 404 });
  }

  return env.ASSETS.fetch(request);
}

export default {
  async fetch(request, env): Promise<Response> {
    try {
      return await handleRequest(request, env);
    } catch (error) {
      if (error instanceof ApiError) {
        return json(
          { error: { code: error.code, message: error.message } },
          { status: error.status }
        );
      }

      console.error(JSON.stringify({
        message: 'unhandled_request_error',
        path: new URL(request.url).pathname,
        error: error instanceof Error ? error.message : String(error)
      }));
      return json(
        { error: { code: 'internal_error', message: 'The request could not be processed.' } },
        { status: 500 }
      );
    }
  }
} satisfies ExportedHandler<Env>;
