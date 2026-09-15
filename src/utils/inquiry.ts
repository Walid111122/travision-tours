/**
 * Shared inquiry submission helper.
 *
 * Both inquiry forms (tour detail and the itinerary planner) use this so the
 * idempotency and error-handling behaviour is identical in both places.
 */

export type InquirySuccess = {
  ok: true;
  reference: string;
  message: string;
  /** True when the server recognised the submission key and replayed a booking. */
  replayed: boolean;
};

export type InquiryFailure = {
  ok: false;
  message: string;
  code?: string;
  /** Safe to retry with the same submission key (server or network hiccup). */
  retryable: boolean;
};

export type InquiryOutcome = InquirySuccess | InquiryFailure;

type BookingApiResponse = {
  booking?: { reference?: string };
  message?: string;
  replay?: boolean;
  error?: { code?: string; message?: string };
};

/**
 * A UUID identifying one intentional submission.
 *
 * Reusing the same key is what makes a double-click or a browser retry return
 * the original booking reference instead of creating a second inquiry. Generate
 * a new key only after a submission succeeds.
 */
export function createSubmissionKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback for browsers without crypto.randomUUID. Still a v4-shaped UUID.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, character => {
    const random = (Math.random() * 16) | 0;
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export async function submitInquiry(
  payload: Record<string, unknown>,
  submissionKey: string
): Promise<InquiryOutcome> {
  let response: Response;

  try {
    response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, idempotencyKey: submissionKey })
    });
  } catch {
    return {
      ok: false,
      message:
        'We could not reach the server. Your details are still in the form — please try again.',
      retryable: true
    };
  }

  const body = (await response.json().catch(() => null)) as BookingApiResponse | null;

  if (!response.ok) {
    return {
      ok: false,
      message: body?.error?.message || 'Your request could not be submitted. Please try again.',
      code: body?.error?.code,
      retryable: response.status >= 500 || response.status === 429
    };
  }

  return {
    ok: true,
    reference: body?.booking?.reference ?? '',
    message: body?.message ?? '',
    replayed: body?.replay === true
  };
}
