const MAX_BODY_BYTES = 16 * 1024;
const INQUIRY_POLICY_VERSION = '2026-08-13';
const PAYMENT_PARTNER_NAME = 'Egypt Online Tour';

type BookingInput = {
  tourId: string;
  tourTitle: string;
  name: string;
  email: string;
  phone: string;
  country?: string;
  preferredDate: string;
  departureDate?: string;
  travelers: number;
  adults: number;
  children: number;
  childAges?: string;
  accommodationPreference?: string;
  contactPreference?: string;
  budgetRange?: string;
  referralSource?: string;
  requirements?: string;
  partnerPaymentAcknowledged: boolean;
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

function optionalChoice(
  value: unknown,
  field: string,
  choices: readonly string[]
): string | undefined {
  const normalized = optionalString(value, field, 80);
  if (normalized && !choices.includes(normalized)) {
    throw new ApiError(422, 'validation_error', `Select a valid ${field.toLowerCase()}.`);
  }
  return normalized;
}

function cairoDate(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function validateBooking(value: unknown): BookingInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError(422, 'validation_error', 'Booking details are required.');
  }

  const input = value as Record<string, unknown>;
  if (optionalString(input.companyWebsite, 'Company website', 200)) {
    throw new ApiError(422, 'validation_error', 'The request could not be submitted.');
  }

  const email = requiredString(input.email, 'Email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(422, 'validation_error', 'Enter a valid email address.');
  }

  const preferredDate = requiredString(input.preferredDate, 'Preferred date', 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate) || Number.isNaN(Date.parse(`${preferredDate}T00:00:00Z`))) {
    throw new ApiError(422, 'validation_error', 'Preferred date must be a valid date.');
  }
  if (preferredDate < cairoDate()) {
    throw new ApiError(422, 'validation_error', 'Preferred date cannot be in the past.');
  }

  const departureDate = optionalString(input.departureDate, 'Departure date', 10);
  if (departureDate && (!/^\d{4}-\d{2}-\d{2}$/.test(departureDate) || Number.isNaN(Date.parse(`${departureDate}T00:00:00Z`)))) {
    throw new ApiError(422, 'validation_error', 'Departure date must be a valid date.');
  }
  if (departureDate && departureDate < preferredDate) {
    throw new ApiError(422, 'validation_error', 'Departure date cannot be before the arrival date.');
  }

  const adults = input.adults;
  const children = input.children;
  if (typeof adults !== 'number' || !Number.isInteger(adults) || adults < 1 || adults > 50) {
    throw new ApiError(422, 'validation_error', 'Adults must be a whole number between 1 and 50.');
  }
  if (typeof children !== 'number' || !Number.isInteger(children) || children < 0 || children > 20) {
    throw new ApiError(422, 'validation_error', 'Children must be a whole number between 0 and 20.');
  }
  if (input.travelers !== adults + children) {
    throw new ApiError(422, 'validation_error', 'Traveler total does not match adults and children.');
  }

  const childAges = optionalString(input.childAges, 'Children ages', 120);
  if (children > 0 && !childAges) {
    throw new ApiError(422, 'validation_error', 'Enter the age of each child.');
  }

  if (
    typeof input.travelers !== 'number' ||
    !Number.isInteger(input.travelers) ||
    input.travelers < 1 ||
    input.travelers > 50
  ) {
    throw new ApiError(422, 'validation_error', 'Travelers must be a whole number between 1 and 50.');
  }

  if (input.partnerPaymentAcknowledged !== true) {
    throw new ApiError(
      422,
      'partner_payment_acknowledgement_required',
      'You must acknowledge that this is a request and that partner payment instructions are sent separately.'
    );
  }

  return {
    tourId: requiredString(input.tourId, 'Tour', 160),
    tourTitle: requiredString(input.tourTitle, 'Tour title', 200),
    name: requiredString(input.name, 'Name', 120),
    email,
    phone: requiredString(input.phone, 'Phone', 40),
    country: optionalString(input.country, 'Country', 80),
    preferredDate,
    departureDate,
    travelers: input.travelers,
    adults,
    children,
    childAges,
    accommodationPreference: optionalChoice(input.accommodationPreference, 'Accommodation preference', ['comfortable', 'premium', 'luxury']),
    contactPreference: optionalChoice(input.contactPreference, 'Contact preference', ['whatsapp', 'email', 'phone']),
    budgetRange: optionalChoice(input.budgetRange, 'Budget range', ['under-1000', '1000-2000', '2000-4000', '4000-plus']),
    referralSource: optionalChoice(input.referralSource, 'Referral source', ['google', 'social', 'friend', 'other']),
    requirements: optionalString(input.requirements, 'Special requirements', 2000),
    partnerPaymentAcknowledged: true
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
        travelers, requirements, departure_date, adults, children, child_ages,
        accommodation_preference, contact_preference, budget_range, referral_source,
        inquiry_policy_version, inquiry_policy_accepted_at, payment_recipient,
        created_at, updated_at
      ) VALUES (?, ?, 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      input.departureDate ?? null,
      input.adults,
      input.children,
      input.childAges ?? null,
      input.accommodationPreference ?? null,
      input.contactPreference ?? null,
      input.budgetRange ?? null,
      input.referralSource ?? null,
      INQUIRY_POLICY_VERSION,
      now,
      PAYMENT_PARTNER_NAME,
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
        recipient: PAYMENT_PARTNER_NAME,
        methods: ['visa', 'mastercard', 'apple_pay', 'wire_transfer'],
        instructions: 'The travel partner will send a secure checkout link or official wire-transfer instructions privately after your quotation is accepted. Travision Tours does not collect payment.'
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
