import { PAYMENT_PARTNER_NAME } from './business';

/**
 * Shared quotation/reservation-policy domain model.
 *
 * This module is imported by the Worker (validation and the printable
 * document renderer), the admin dashboard, the CMS scripts and the tests, so
 * the status machine and required-field list can never drift between the
 * layers. It has no Vite-only dependencies (`import.meta.env` is never used)
 * and is safe inside workerd.
 *
 * Business rule (owner decision): there is no universal child, hotel or
 * cancellation policy. The quotation document is where reservation-specific
 * conditions live, and payment always goes to the payment partner — never to
 * Travision Tours and never through the website.
 */

export const QUOTATION_STATUSES = [
  'draft',
  'ready_for_review',
  'approved',
  'sent',
  'accepted',
  'awaiting_payment',
  'paid',
  'confirmed',
  'declined',
  'expired',
  'cancelled'
] as const;

export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

/**
 * The only transitions the API will perform. Nothing is ever auto-advanced —
 * sending, acceptance, payment and confirmation are recorded by an
 * administrator after they happen in the real world.
 */
export const QUOTATION_TRANSITIONS: Record<QuotationStatus, readonly QuotationStatus[]> = {
  draft: ['ready_for_review', 'cancelled'],
  ready_for_review: ['approved', 'draft', 'cancelled'],
  approved: ['sent', 'draft', 'cancelled'],
  sent: ['accepted', 'declined', 'expired', 'cancelled'],
  accepted: ['awaiting_payment', 'cancelled'],
  awaiting_payment: ['paid', 'expired', 'cancelled'],
  paid: ['confirmed', 'cancelled'],
  confirmed: ['cancelled'],
  declined: [],
  expired: [],
  cancelled: []
};

/** Statuses at which the current document version is frozen for the customer. */
export const IMMUTABLE_AFTER_SENT: readonly QuotationStatus[] = [
  'sent',
  'accepted',
  'awaiting_payment',
  'paid',
  'confirmed',
  'declined',
  'expired',
  'cancelled'
];

/**
 * Customer-facing fields of the quotation document. Internal working notes
 * are deliberately NOT part of this shape — they live on the row in
 * `internal_notes` and can never reach the rendered PDF.
 */
export interface QuotationData {
  // Customer & travel
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  inquiryReference: string;
  travelDates: string;
  adults: string;
  childrenAges: string;
  pickupMeeting: string;
  itinerary: string;
  // Accommodation
  hotelSelection: string;
  roomTypeOccupancy: string;
  mealBasis: string;
  hotelChildPolicy: string;
  childInfantPricing: string;
  // Money
  totalPrice: string;
  priceBreakdown: string;
  depositAmount: string;
  balanceAndDeadline: string;
  currency: string;
  // Payment
  paymentRecipient: string;
  paymentMethods: string;
  paymentInstructions: string;
  // Reservation-specific policy
  cancellationSchedule: string;
  amendmentTerms: string;
  noShowPolicy: string;
  unusedServicesPolicy: string;
  specialConditions: string;
  // Scope
  inclusions: string;
  exclusions: string;
  optionalServices: string;
  specialRequests: string;
  // Document
  issueDate: string;
  expirationDate: string;
  eotContactDetails: string;
  preparedBy: string;
  customerNotes: string;
}

/** All customer-facing fields, in document order, with their labels. */
export const QUOTATION_FIELDS: ReadonlyArray<{
  key: keyof QuotationData;
  label: string;
  required: boolean;
}> = [
  { key: 'issueDate', label: 'Issue date', required: true },
  { key: 'expirationDate', label: 'Offer valid until', required: true },
  { key: 'customerName', label: 'Customer name', required: true },
  { key: 'customerEmail', label: 'Customer email', required: true },
  { key: 'customerPhone', label: 'Customer phone / WhatsApp', required: false },
  { key: 'inquiryReference', label: 'Inquiry reference', required: false },
  { key: 'travelDates', label: 'Travel dates', required: true },
  { key: 'adults', label: 'Adults (12+)', required: true },
  { key: 'childrenAges', label: 'Children (ages)', required: true },
  { key: 'pickupMeeting', label: 'Pickup / meeting point', required: true },
  { key: 'itinerary', label: 'Final itinerary', required: true },
  { key: 'hotelSelection', label: 'Selected hotel(s) / cruise', required: true },
  { key: 'roomTypeOccupancy', label: 'Room type & occupancy', required: true },
  { key: 'mealBasis', label: 'Meal basis', required: true },
  { key: 'hotelChildPolicy', label: 'Hotel child policy', required: true },
  { key: 'childInfantPricing', label: 'Child & infant pricing', required: true },
  { key: 'totalPrice', label: 'Total price', required: true },
  { key: 'priceBreakdown', label: 'Price breakdown', required: true },
  { key: 'depositAmount', label: 'Deposit', required: true },
  { key: 'balanceAndDeadline', label: 'Balance & deadline', required: true },
  { key: 'currency', label: 'Currency', required: true },
  { key: 'paymentRecipient', label: 'Payment recipient', required: true },
  { key: 'paymentMethods', label: 'Accepted payment methods', required: true },
  { key: 'paymentInstructions', label: 'Payment instructions', required: true },
  { key: 'cancellationSchedule', label: 'Cancellation schedule', required: true },
  { key: 'amendmentTerms', label: 'Amendment conditions', required: true },
  { key: 'noShowPolicy', label: 'No-show policy', required: true },
  { key: 'unusedServicesPolicy', label: 'Unused-services policy', required: true },
  { key: 'specialConditions', label: 'Special-event / supplier conditions', required: true },
  { key: 'inclusions', label: 'Inclusions', required: true },
  { key: 'exclusions', label: 'Exclusions', required: true },
  { key: 'optionalServices', label: 'Optional services', required: true },
  { key: 'specialRequests', label: 'Special requests noted', required: true },
  { key: 'eotContactDetails', label: 'Partner contact details', required: true },
  { key: 'preparedBy', label: 'Prepared by', required: false },
  { key: 'customerNotes', label: 'Customer-facing notes', required: false }
];

export const REQUIRED_QUOTATION_FIELDS = QUOTATION_FIELDS.filter(f => f.required).map(
  f => f.key
);

/**
 * Markers that mean "the operator has not resolved this field yet". Any of
 * these in a required field blocks the draft → ready_for_review transition.
 */
export const PLACEHOLDER_MARKERS = [
  '[',
  ']',
  'to be confirmed',
  'insert ',
  'tbd',
  'placeholder'
] as const;

export function emptyQuotationData(currency: string): QuotationData {
  return {
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    inquiryReference: '',
    travelDates: '',
    adults: '',
    childrenAges: 'None',
    pickupMeeting: '',
    itinerary: '',
    hotelSelection: '',
    roomTypeOccupancy: '',
    mealBasis: '',
    hotelChildPolicy: '',
    childInfantPricing: '',
    totalPrice: '',
    priceBreakdown: '',
    depositAmount: '',
    balanceAndDeadline: '',
    currency,
    paymentRecipient: PAYMENT_PARTNER_NAME,
    paymentMethods: 'Visa, Mastercard, Apple Pay, wire transfer',
    paymentInstructions: '',
    cancellationSchedule: '',
    amendmentTerms: '',
    noShowPolicy: '',
    unusedServicesPolicy: '',
    specialConditions: '',
    inclusions: '',
    exclusions: '',
    optionalServices: 'None offered',
    specialRequests: 'None recorded',
    issueDate: '',
    expirationDate: '',
    eotContactDetails: '',
    preparedBy: '',
    customerNotes: ''
  };
}

/**
 * Required fields that are empty or still contain placeholder markers.
 * The document cannot move to `ready_for_review` while this list is non-empty.
 */
export function unresolvedQuotationFields(data: QuotationData): (keyof QuotationData)[] {
  return REQUIRED_QUOTATION_FIELDS.filter(key => {
    const value = (data[key] ?? '').trim();
    if (!value) return true;
    const lower = value.toLowerCase();
    return PLACEHOLDER_MARKERS.some(marker => lower.includes(marker));
  });
}
