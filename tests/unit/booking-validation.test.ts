import { describe, expect, it } from 'vitest';
import { ApiError } from '../../worker/http';
import {
  boundedInteger,
  isExactCalendarDate,
  parseChildAges,
  parseEmail,
  parseIdempotencyKey,
  parsePhone
} from '../../worker/validation';
import { validateBooking, parseSource, parseItineraryStops, resolveTour } from '../../worker/booking';
import { MAX_ITINERARY_STOPS } from '../../src/plannerStops';

/**
 * Unit coverage for the booking boundary.
 *
 * Ported from the hand-rolled `scripts/phase3-unit.ts` so the assertions live in
 * the maintained runner. The behaviour is unchanged; only the reporting is.
 */

/** The `ApiError` code a call throws, or a marker when it does not throw. */
function errorCodeOf(action: () => unknown): string {
  try {
    action();
    return 'NO_ERROR_THROWN';
  } catch (error) {
    return error instanceof ApiError ? error.code : `NOT_API_ERROR:${String(error)}`;
  }
}

/** A minimal valid payload; individual tests override one field at a time. */
const baseBooking = {
  name: 'Test',
  email: 'test@example.com',
  phone: '+201028838866',
  preferredDate: '2027-06-10',
  adults: 1,
  children: 0,
  travelers: 1,
  partnerPaymentAcknowledged: true
};

describe('exact calendar dates', () => {
  // A `Date` built from an impossible day silently rolls over — 2026-02-31 becomes
  // 2026-03-03 — so the parser must compare the round-tripped value, not just
  // check the shape.
  it.each([
    ['2026-02-31', false, 'February has no 31st'],
    ['2026-04-31', false, 'April has 30 days'],
    ['2026-13-01', false, 'month 13'],
    ['2026-00-10', false, 'month 0'],
    ['2026-01-00', false, 'day 0'],
    ['2024-02-29', true, '2024 is a leap year'],
    ['2026-02-29', false, '2026 is not a leap year'],
    ['2026-12-31', true, 'the last day of the year'],
    ['2026-1-1', false, 'non-padded input']
  ])('%s -> %s (%s)', (value, expected) => {
    expect(isExactCalendarDate(value)).toBe(expected);
  });
});

describe('phone numbers', () => {
  it('rejects a 6-digit number', () => {
    expect(errorCodeOf(() => parsePhone('123456'))).toBe('validation_error');
  });

  it('accepts a 7-digit number', () => {
    expect(errorCodeOf(() => parsePhone('1234567'))).toBe('NO_ERROR_THROWN');
  });

  it('accepts 15 digits, the E.164 maximum', () => {
    expect(errorCodeOf(() => parsePhone('+123456789012345'))).toBe('NO_ERROR_THROWN');
  });

  it('rejects 16 digits', () => {
    expect(errorCodeOf(() => parsePhone('+1234567890123456'))).toBe('validation_error');
  });

  it('accepts punctuation and a leading +', () => {
    expect(errorCodeOf(() => parsePhone('+1 (202) 555-0143'))).toBe('NO_ERROR_THROWN');
  });

  it('rejects letters', () => {
    expect(errorCodeOf(() => parsePhone('+1 202 ABC 0143'))).toBe('validation_error');
  });

  it('rejects a + anywhere but the front', () => {
    expect(errorCodeOf(() => parsePhone('1+2025550143'))).toBe('validation_error');
  });
});

describe('email addresses', () => {
  it('rejects anything over 254 characters', () => {
    expect(errorCodeOf(() => parseEmail(`${'a'.repeat(250)}@x.com`))).toBe('validation_error');
  });

  it('rejects a missing domain', () => {
    expect(errorCodeOf(() => parseEmail('walid@'))).toBe('validation_error');
  });
});

describe('child ages and counts', () => {
  it('accepts no ages when there are no children', () => {
    expect(errorCodeOf(() => parseChildAges(undefined, 0))).toBe('NO_ERROR_THROWN');
  });

  it('rejects stray ages when there are no children', () => {
    expect(errorCodeOf(() => parseChildAges('5', 0))).toBe('validation_error');
  });

  it('accepts exactly one age per child', () => {
    expect(errorCodeOf(() => parseChildAges('6, 10', 2))).toBe('NO_ERROR_THROWN');
  });

  it('rejects fewer ages than children', () => {
    expect(errorCodeOf(() => parseChildAges('6', 2))).toBe('validation_error');
  });

  it('rejects more ages than children', () => {
    expect(errorCodeOf(() => parseChildAges('6, 10, 12', 2))).toBe('validation_error');
  });

  it('accepts age 17', () => {
    expect(errorCodeOf(() => parseChildAges('17', 1))).toBe('NO_ERROR_THROWN');
  });

  it('rejects age 18, which is an adult', () => {
    expect(errorCodeOf(() => parseChildAges('18', 1))).toBe('validation_error');
  });
});

describe('bounded integers', () => {
  it('rejects a value above the maximum', () => {
    expect(errorCodeOf(() => boundedInteger(51, 'Adults', 1, 50))).toBe('validation_error');
  });

  it('accepts a value at the minimum', () => {
    expect(errorCodeOf(() => boundedInteger(1, 'Adults', 1, 50))).toBe('NO_ERROR_THROWN');
  });
});

describe('submission (idempotency) keys', () => {
  it('accepts a v4 UUID', () => {
    expect(errorCodeOf(() => parseIdempotencyKey('123e4567-e89b-42d3-a456-426614174000'))).toBe(
      'NO_ERROR_THROWN'
    );
  });

  it('rejects a non-UUID', () => {
    expect(errorCodeOf(() => parseIdempotencyKey('abc'))).toBe('validation_error');
  });

  it('rejects an over-length key', () => {
    expect(errorCodeOf(() => parseIdempotencyKey('a'.repeat(80)))).toBe('validation_error');
  });
});

describe('canonical tour resolution', () => {
  it('rejects an unknown tour ID', () => {
    expect(errorCodeOf(() => validateBooking({ ...baseBooking, tourId: 'nope' }))).toBe(
      'unknown_tour'
    );
  });

  it('does not require a tour ID for the planner source', () => {
    expect(
      errorCodeOf(() =>
        validateBooking({ ...baseBooking, source: 'planner', itineraryStopIds: ['1'] })
      )
    ).toBe('NO_ERROR_THROWN');
  });

  it('takes the stored title from the catalog, ignoring a client-supplied one', () => {
    // The client is never trusted for the title: it feeds the operator
    // notification, so a spoofed value would be socially engineered into an email.
    const resolved = validateBooking({
      ...baseBooking,
      tourId: 'cairo-day-tour',
      tourTitle: 'Spoofed title'
    });
    expect(resolved.tourTitle).toBe('Cairo Day Tour');
  });
});

describe('preferred date ordering', () => {
  const now = new Date('2026-09-14T12:00:00Z');

  it('rejects a date in the past', () => {
    expect(
      errorCodeOf(() =>
        validateBooking({ ...baseBooking, tourId: 'cairo-day-tour', preferredDate: '2026-01-01' }, now)
      )
    ).toBe('validation_error');
  });

  it('accepts a date in the future', () => {
    expect(
      errorCodeOf(() =>
        validateBooking({ ...baseBooking, tourId: 'cairo-day-tour', preferredDate: '2026-10-01' }, now)
      )
    ).toBe('NO_ERROR_THROWN');
  });

  it('rejects a departure date that precedes the preferred date', () => {
    // Date *order*, not just each date in isolation: a return before the
    // departure is impossible regardless of how valid each date looks.
    expect(
      errorCodeOf(() =>
        validateBooking(
          {
            ...baseBooking,
            tourId: 'cairo-day-tour',
            preferredDate: '2027-06-10',
            departureDate: '2027-06-01'
          },
          now
        )
      )
    ).toBe('validation_error');
  });
});

describe('traveler totals', () => {
  it('rejects a total that disagrees with adults plus children', () => {
    expect(
      errorCodeOf(() =>
        validateBooking({ ...baseBooking, tourId: 'cairo-day-tour', adults: 2, children: 0, travelers: 3 })
      )
    ).toBe('validation_error');
  });

  it('accepts a total that agrees', () => {
    // One child means exactly one age must be supplied, which is why `childAges`
    // is present here.
    expect(
      errorCodeOf(() =>
        validateBooking({
          ...baseBooking,
          tourId: 'cairo-day-tour',
          adults: 2,
          children: 1,
          travelers: 3,
          childAges: '8'
        })
      )
    ).toBe('NO_ERROR_THROWN');
  });
});

describe('partner payment acknowledgement', () => {
  // The site never collects payment. A submission that has not acknowledged
  // that must not be stored, or the operator could act on an inquiry whose
  // sender was never told who will invoice them.
  it('rejects a submission that has not acknowledged it', () => {
    expect(
      errorCodeOf(() =>
        validateBooking({ ...baseBooking, tourId: 'cairo-day-tour', partnerPaymentAcknowledged: false })
      )
    ).toBe('partner_payment_acknowledgement_required');
  });

  it('requires an explicit boolean true, not a truthy value', () => {
    expect(
      errorCodeOf(() =>
        validateBooking({ ...baseBooking, tourId: 'cairo-day-tour', partnerPaymentAcknowledged: 'yes' })
      )
    ).toBe('partner_payment_acknowledgement_required');
  });
});

describe('honeypot field', () => {
  it('rejects a submission that filled the hidden field', () => {
    expect(
      errorCodeOf(() =>
        validateBooking({ ...baseBooking, tourId: 'cairo-day-tour', companyWebsite: 'spam.example' })
      )
    ).toBe('validation_error');
  });
});

describe('enumeration fields', () => {
  it.each([
    ['accommodationPreference', 'carrier-pigeon'],
    ['contactPreference', 'carrier-pigeon'],
    ['budgetRange', 'carrier-pigeon'],
    ['referralSource', 'carrier-pigeon']
  ])('rejects an unknown %s', (field, value) => {
    expect(
      errorCodeOf(() =>
        validateBooking({ ...baseBooking, tourId: 'cairo-day-tour', [field]: value })
      )
    ).toBe('validation_error');
  });

  it.each([
    ['accommodationPreference', 'luxury-5-star'],
    ['contactPreference', 'whatsapp'],
    ['budgetRange', '1000-2000'],
    ['referralSource', 'google']
  ])('accepts a known %s', (field, value) => {
    expect(
      errorCodeOf(() =>
        validateBooking({ ...baseBooking, tourId: 'cairo-day-tour', [field]: value })
      )
    ).toBe('NO_ERROR_THROWN');
  });
});

describe('inquiry source', () => {
  it('defaults to a tour inquiry when absent', () => {
    expect(parseSource(undefined)).toBe('tour');
  });

  it('accepts the planner source', () => {
    expect(parseSource('planner')).toBe('planner');
  });

  it('rejects an unknown source', () => {
    expect(errorCodeOf(() => parseSource('newsletter'))).toBe('validation_error');
  });
});

describe('planner itinerary stops', () => {
  it('rejects a non-array payload', () => {
    expect(errorCodeOf(() => parseItineraryStops('1'))).toBe('validation_error');
  });

  it('rejects stop objects instead of IDs', () => {
    expect(errorCodeOf(() => parseItineraryStops([{ id: '1' }]))).toBe('validation_error');
  });

  it('rejects an empty selection', () => {
    expect(errorCodeOf(() => parseItineraryStops([]))).toBe('validation_error');
  });

  it('rejects a repeated stop', () => {
    // Duplicate detection runs before catalog resolution, so this is rejected
    // even though both IDs are real.
    expect(errorCodeOf(() => parseItineraryStops(['1', '1']))).toBe('validation_error');
  });

  it('rejects an unknown stop', () => {
    expect(errorCodeOf(() => parseItineraryStops(['not-a-real-stop']))).toBe('validation_error');
  });

  it('rejects more stops than the maximum', () => {
    const tooMany = Array.from({ length: MAX_ITINERARY_STOPS + 1 }, (_, i) => String(i + 1));
    expect(errorCodeOf(() => parseItineraryStops(tooMany))).toBe('validation_error');
  });

  it('accepts exactly the maximum', () => {
    const atLimit = Array.from({ length: MAX_ITINERARY_STOPS }, (_, i) => String(i + 1));
    expect(errorCodeOf(() => parseItineraryStops(atLimit))).toBe('NO_ERROR_THROWN');
  });

  it('resolves titles and locations from the catalog, not the payload', () => {
    const stops = parseItineraryStops(['1', '14']);
    expect(stops).toEqual([
      { id: '1', title: 'Pyramids of Giza', location: 'Giza' },
      { id: '14', title: 'Valley of the Kings', location: 'Luxor' }
    ]);
  });
});

describe('resolveTour', () => {
  it('uses the fixed internal identity for the planner source', () => {
    expect(resolveTour({}, 'planner')).toEqual({
      tourId: 'custom-itinerary',
      tourTitle: 'Custom itinerary request'
    });
  });

  it('rejects a missing tour ID for a tour inquiry', () => {
    expect(errorCodeOf(() => resolveTour({}, 'tour'))).toBe('validation_error');
  });
});
