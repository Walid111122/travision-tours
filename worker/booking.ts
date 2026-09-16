import { ApiError } from './http';
import { findCatalogTour } from './catalog';
import { MAX_ITINERARY_STOPS, findPlannerStop } from '../src/plannerStops';
import {
  LIMITS,
  boundedInteger,
  optionalChoice,
  optionalExactDate,
  optionalString,
  parseChildAges,
  parseEmail,
  parseIdempotencyKey,
  parsePhone,
  parseTurnstileToken,
  rejectHoneypot,
  requiredExactDate,
  requiredString
} from './validation';

const PLANNER_TOUR_ID = 'custom-itinerary';
const PLANNER_TOUR_TITLE = 'Custom itinerary request';

export type InquirySource = 'tour' | 'planner';

export type ItineraryStop = {
  id: string;
  title: string;
  location: string;
};

export type BookingInput = {
  source: InquirySource;
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
  itineraryStops: ItineraryStop[];
  idempotencyKey?: string;
  /** Server-generated after validation; never accepted from the request body. */
  requestFingerprint?: string;
  turnstileToken?: string;
  partnerPaymentAcknowledged: boolean;
};

export function parseSource(value: unknown): InquirySource {
  if (value === undefined || value === null || value === '') return 'tour';
  if (value === 'tour' || value === 'planner') return value;
  throw new ApiError(422, 'validation_error', 'Select a valid inquiry source.');
}

/**
 * Resolve submitted stop IDs against the shared planner catalog. Titles and
 * locations are read from the catalog, never from the request body.
 */
export function parseItineraryStops(value: unknown): ItineraryStop[] {
  if (!Array.isArray(value)) {
    throw new ApiError(422, 'validation_error', 'Select at least one stop for your itinerary.');
  }

  if (!value.every((entry): entry is string => typeof entry === 'string')) {
    throw new ApiError(422, 'validation_error', 'Itinerary stops must be submitted as stop IDs.');
  }

  const ids = value as string[];
  if (ids.length < 1 || ids.length > MAX_ITINERARY_STOPS) {
    throw new ApiError(
      422,
      'validation_error',
      `Select between 1 and ${MAX_ITINERARY_STOPS} stops for your itinerary.`
    );
  }

  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length !== ids.length) {
    throw new ApiError(422, 'validation_error', 'Each itinerary stop may only appear once.');
  }

  return uniqueIds.map(stopId => {
    const stop = findPlannerStop(stopId);
    if (!stop) {
      throw new ApiError(422, 'validation_error', 'Your itinerary contains an unknown stop.');
    }
    return { id: stop.id, title: stop.title, location: stop.location };
  });
}

/**
 * Resolve the tour from the server-side catalog. An unknown or altered tour ID
 * is rejected outright, and the stored title always comes from the catalog —
 * never from the request body.
 */
export function resolveTour(
  input: Record<string, unknown>,
  source: InquirySource
): { tourId: string; tourTitle: string } {
  if (source === 'planner') {
    return { tourId: PLANNER_TOUR_ID, tourTitle: PLANNER_TOUR_TITLE };
  }

  const tourId = requiredString(input.tourId, 'Tour', LIMITS.tourId);
  const tour = findCatalogTour(tourId);
  if (!tour) {
    throw new ApiError(
      422,
      'unknown_tour',
      'That tour is no longer available. Please pick another tour and try again.'
    );
  }

  return { tourId: tour.id, tourTitle: tour.title };
}

/** Today's date in the operator's timezone, as YYYY-MM-DD. */
export function cairoDate(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function validateBooking(value: unknown, now: Date = new Date()): BookingInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError(422, 'validation_error', 'Booking details are required.');
  }

  const input = value as Record<string, unknown>;

  // Honeypot: a secondary spam signal, checked first so bots get no detail.
  rejectHoneypot(input.companyWebsite);

  const email = parseEmail(input.email);
  const phone = parsePhone(input.phone);

  const preferredDate = requiredExactDate(input.preferredDate, 'Preferred date');
  if (preferredDate < cairoDate(now)) {
    throw new ApiError(422, 'validation_error', 'Preferred date cannot be in the past.');
  }

  const departureDate = optionalExactDate(input.departureDate, 'Departure date');
  if (departureDate && departureDate < preferredDate) {
    throw new ApiError(
      422,
      'validation_error',
      'Departure date cannot be before the arrival date.'
    );
  }

  const adults = boundedInteger(input.adults, 'Adults', LIMITS.adultsMin, LIMITS.adultsMax);
  const children = boundedInteger(
    input.children,
    'Children',
    LIMITS.childrenMin,
    LIMITS.childrenMax
  );

  const travelers = boundedInteger(
    input.travelers,
    'Travelers',
    LIMITS.travelersMin,
    LIMITS.travelersMax
  );
  if (travelers !== adults + children) {
    throw new ApiError(
      422,
      'validation_error',
      'Traveler total does not match adults and children.'
    );
  }

  const childAges = parseChildAges(input.childAges, children);

  if (input.partnerPaymentAcknowledged !== true) {
    throw new ApiError(
      422,
      'partner_payment_acknowledgement_required',
      'You must acknowledge that this is a request and that partner payment instructions are sent separately.'
    );
  }

  const source = parseSource(input.source);
  const itineraryStops = source === 'planner' ? parseItineraryStops(input.itineraryStopIds) : [];
  const { tourId, tourTitle } = resolveTour(input, source);

  return {
    source,
    tourId,
    tourTitle,
    name: requiredString(input.name, 'Name', LIMITS.name),
    email,
    phone,
    country: optionalString(input.country, 'Country', LIMITS.country),
    preferredDate,
    departureDate,
    travelers,
    adults,
    children,
    childAges,
    accommodationPreference: optionalChoice(input.accommodationPreference, 'Accommodation preference', [
      'budget-3-star',
      'standard-4-star',
      'luxury-5-star',
      'mixed',
      'flexible'
    ]),
    contactPreference: optionalChoice(input.contactPreference, 'Contact preference', [
      'whatsapp',
      'email',
      'phone'
    ]),
    budgetRange: optionalChoice(input.budgetRange, 'Budget range', [
      'under-1000',
      '1000-2000',
      '2000-4000',
      '4000-plus'
    ]),
    referralSource: optionalChoice(input.referralSource, 'Referral source', [
      'google',
      'social',
      'friend',
      'other'
    ]),
    requirements: optionalString(input.requirements, 'Special requirements', LIMITS.requirements),
    itineraryStops,
    idempotencyKey: parseIdempotencyKey(input.idempotencyKey),
    turnstileToken: parseTurnstileToken(input.turnstileToken),
    partnerPaymentAcknowledged: true
  };
}
