import { ApiError } from './http';

/**
 * Explicit limits for every accepted string and array.
 *
 * Nothing is unbounded: each field the API accepts has a documented maximum,
 * and every boundary is exercised by the Phase 9 test suite.
 */
export const LIMITS = {
  tourId: 160,
  name: 120,
  email: 254,
  phone: 40,
  country: 80,
  childAges: 120,
  requirements: 2000,
  idempotencyKey: 64,
  turnstileToken: 2048,
  honeypot: 200,
  adultsMin: 1,
  adultsMax: 50,
  childrenMin: 0,
  childrenMax: 20,
  travelersMin: 1,
  travelersMax: 50,
  childAgeMax: 17
} as const;

export function requiredString(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ApiError(422, 'validation_error', `${field} is required.`);
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new ApiError(
      422,
      'validation_error',
      `${field} is too long (maximum ${maxLength} characters).`
    );
  }
  return normalized;
}

export function optionalString(
  value: unknown,
  field: string,
  maxLength: number
): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') {
    throw new ApiError(422, 'validation_error', `${field} must be text.`);
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new ApiError(
      422,
      'validation_error',
      `${field} is too long (maximum ${maxLength} characters).`
    );
  }
  return normalized || undefined;
}

export function optionalChoice(
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

export function boundedInteger(
  value: unknown,
  field: string,
  min: number,
  max: number
): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    throw new ApiError(
      422,
      'validation_error',
      `${field} must be a whole number between ${min} and ${max}.`
    );
  }
  return value;
}

export function parseEmail(value: unknown): string {
  const email = requiredString(value, 'Email', LIMITS.email).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(422, 'validation_error', 'Enter a valid email address.');
  }
  return email;
}

/**
 * Accepts the punctuation people actually type — spaces, dashes, dots,
 * parentheses and a single leading `+` — while requiring 7–15 digits, which is
 * the ITU-T E.164 range.
 */
export function parsePhone(value: unknown): string {
  const raw = requiredString(value, 'Phone', LIMITS.phone);

  if (!/^\+?[\d\s().-]+$/.test(raw)) {
    throw new ApiError(422, 'validation_error', 'Enter a valid phone number.');
  }
  // A `+` is only meaningful as the very first character.
  if (raw.indexOf('+') > 0) {
    throw new ApiError(422, 'validation_error', 'Enter a valid phone number.');
  }

  const digits = raw.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) {
    throw new ApiError(
      422,
      'validation_error',
      'Enter a valid phone number, including the country code.'
    );
  }
  return raw;
}

/**
 * True only when `value` is a real calendar date in `YYYY-MM-DD` form.
 *
 * `Date.parse` normalises impossible dates (2026-02-31 becomes 2026-03-03), so
 * the parsed components are compared back against the original input instead.
 */
export function isExactCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;

  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export function requiredExactDate(value: unknown, field: string): string {
  const raw = requiredString(value, field, 10);
  if (!isExactCalendarDate(raw)) {
    throw new ApiError(
      422,
      'validation_error',
      `${field} must be a real calendar date in YYYY-MM-DD form.`
    );
  }
  return raw;
}

export function optionalExactDate(value: unknown, field: string): string | undefined {
  const raw = optionalString(value, field, 10);
  if (!raw) return undefined;
  if (!isExactCalendarDate(raw)) {
    throw new ApiError(
      422,
      'validation_error',
      `${field} must be a real calendar date in YYYY-MM-DD form.`
    );
  }
  return raw;
}

/**
 * Validate children's ages as numbers and require the count to match the
 * selected number of children. Returns a normalised `"6, 10"` string.
 */
export function parseChildAges(value: unknown, childrenCount: number): string | undefined {
  const raw = optionalString(value, 'Children ages', LIMITS.childAges);

  if (childrenCount === 0) {
    if (raw) {
      throw new ApiError(
        422,
        'validation_error',
        'Remove the children ages, or set the number of children.'
      );
    }
    return undefined;
  }

  if (!raw) {
    throw new ApiError(422, 'validation_error', 'Enter the age of each child.');
  }

  const parts = raw
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);

  if (parts.length !== childrenCount) {
    throw new ApiError(
      422,
      'validation_error',
      `Enter exactly ${childrenCount} child ${childrenCount === 1 ? 'age' : 'ages'}, separated by commas.`
    );
  }

  const ages = parts.map(part => {
    if (!/^\d{1,2}$/.test(part)) {
      throw new ApiError(422, 'validation_error', 'Each child age must be a whole number.');
    }
    const age = Number(part);
    if (age > LIMITS.childAgeMax) {
      throw new ApiError(
        422,
        'validation_error',
        `Child ages must be ${LIMITS.childAgeMax} or younger.`
      );
    }
    return age;
  });

  return ages.join(', ');
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Optional client submission key. When present it must be a UUID, and it is
 * what makes a retried request replay the original booking.
 */
export function parseIdempotencyKey(value: unknown): string | undefined {
  const raw = optionalString(value, 'Submission key', LIMITS.idempotencyKey);
  if (!raw) return undefined;
  if (!UUID_PATTERN.test(raw)) {
    throw new ApiError(422, 'validation_error', 'The submission key is not valid.');
  }
  return raw.toLowerCase();
}

export function parseTurnstileToken(value: unknown): string | undefined {
  return optionalString(value, 'Anti-bot token', LIMITS.turnstileToken);
}

/**
 * The honeypot is a secondary spam signal only — Turnstile and rate limiting
 * are the primary defences.
 */
export function rejectHoneypot(value: unknown): void {
  if (optionalString(value, 'Company website', LIMITS.honeypot)) {
    throw new ApiError(422, 'validation_error', 'The request could not be submitted.');
  }
}
