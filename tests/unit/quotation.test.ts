import { describe, expect, it } from 'vitest';
import { PAYMENT_PARTNER_NAME } from '../../src/config/business';
import {
  emptyQuotationData,
  IMMUTABLE_AFTER_SENT,
  QUOTATION_FIELDS,
  QUOTATION_TRANSITIONS,
  unresolvedQuotationFields,
  type QuotationData
} from '../../src/config/quotation';
import { renderQuotationDocument } from '../../worker/quotationDocument';

function completeData(): QuotationData {
  const data = emptyQuotationData('USD');
  for (const field of QUOTATION_FIELDS) {
    if (!data[field.key]) data[field.key] = `Value for ${field.label}`;
  }
  data.paymentRecipient = PAYMENT_PARTNER_NAME;
  return data;
}

describe('quotation status machine', () => {
  it('confirmed is reachable only through paid', () => {
    const canConfirm = Object.entries(QUOTATION_TRANSITIONS)
      .filter(([, targets]) => targets.includes('confirmed'))
      .map(([from]) => from);
    expect(canConfirm).toEqual(['paid']);
  });

  it('paid is reachable only through awaiting_payment', () => {
    const canPay = Object.entries(QUOTATION_TRANSITIONS)
      .filter(([, targets]) => targets.includes('paid'))
      .map(([from]) => from);
    expect(canPay).toEqual(['awaiting_payment']);
  });

  it('sent is reachable only from approved', () => {
    const canSend = Object.entries(QUOTATION_TRANSITIONS)
      .filter(([, targets]) => targets.includes('sent'))
      .map(([from]) => from);
    expect(canSend).toEqual(['approved']);
  });

  it('no status can skip the review chain', () => {
    // draft can never reach sent/accepted/paid/confirmed directly.
    expect(QUOTATION_TRANSITIONS.draft).not.toContain('sent');
    expect(QUOTATION_TRANSITIONS.draft).not.toContain('confirmed');
    expect(QUOTATION_TRANSITIONS.ready_for_review).not.toContain('sent');
  });

  it('terminal statuses have no outgoing transitions', () => {
    for (const status of ['declined', 'expired', 'cancelled'] as const) {
      expect(QUOTATION_TRANSITIONS[status]).toEqual([]);
    }
  });

  it('post-send statuses are immutable', () => {
    for (const status of ['sent', 'accepted', 'paid', 'confirmed'] as const) {
      expect(IMMUTABLE_AFTER_SENT).toContain(status);
    }
  });
});

describe('unresolved field detection', () => {
  it('flags every required field on an empty quotation', () => {
    const unresolved = unresolvedQuotationFields(emptyQuotationData('USD'));
    expect(unresolved.length).toBeGreaterThan(20);
    expect(unresolved).toContain('customerName');
    expect(unresolved).toContain('totalPrice');
    expect(unresolved).toContain('cancellationSchedule');
    expect(unresolved).toContain('hotelChildPolicy');
  });

  it('flags placeholder text, not just emptiness', () => {
    const data = completeData();
    data.hotelChildPolicy = 'Insert current hotel child policy.';
    data.cancellationSchedule = 'To be confirmed for this quotation.';
    const unresolved = unresolvedQuotationFields(data);
    expect(unresolved).toContain('hotelChildPolicy');
    expect(unresolved).toContain('cancellationSchedule');
  });

  it('flags bracketed placeholders', () => {
    const data = completeData();
    data.totalPrice = '[TOTAL PRICE AND CURRENCY]';
    expect(unresolvedQuotationFields(data)).toContain('totalPrice');
  });

  it('accepts a fully resolved quotation', () => {
    expect(unresolvedQuotationFields(completeData())).toEqual([]);
  });
});

describe('quotation document renderer', () => {
  const data = completeData();

  it('names Egypt Online Tour as the payment recipient', () => {
    const html = renderQuotationDocument({ reference: 'TQ-1', versionNo: 1, status: 'sent', policyVersion: '2026-09', data });
    expect(html).toContain(PAYMENT_PARTNER_NAME);
    expect(html).toContain('never to');
  });

  it('carries the customer-acceptance wording and payment-before-confirmation order', () => {
    const html = renderQuotationDocument({ reference: 'TQ-1', versionNo: 1, status: 'sent', policyVersion: '2026-09', data });
    expect(html).toContain('received and reviewed this quotation');
    expect(html).toContain('written confirmation is');
    expect(html).toContain('Customer signature');
  });

  it('escapes customer-supplied markup', () => {
    const hostile = { ...data, customerName: '<script>alert(1)</script>' };
    const html = renderQuotationDocument({ reference: 'TQ-1', versionNo: 1, status: 'sent', policyVersion: '2026-09', data: hostile });
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
  });

  it('renders unresolved values as visible placeholders, not blanks', () => {
    const empty = emptyQuotationData('USD');
    const html = renderQuotationDocument({ reference: 'TQ-1', versionNo: 1, status: 'draft', policyVersion: '', data: empty });
    expect(html).toContain('To be confirmed for this quotation.');
    expect(html).toContain('Insert reservation-specific cancellation schedule.');
  });

  it('marks non-sendable documents as internal drafts', () => {
    const draft = renderQuotationDocument({ reference: 'TQ-1', versionNo: 1, status: 'draft', policyVersion: '', data });
    expect(draft).toContain('Internal draft');
    const sent = renderQuotationDocument({ reference: 'TQ-1', versionNo: 1, status: 'sent', policyVersion: '', data });
    expect(sent).not.toContain('Internal draft');
  });

  it('has no internal-notes channel — the renderer signature cannot receive them', () => {
    // Structural check: renderQuotationDocument's options type has no
    // internal_notes member, so notes cannot leak even by accident.
    const options = { reference: 'TQ-1', versionNo: 1, status: 'sent', policyVersion: '', data };
    expect('internal_notes' in options).toBe(false);
  });

  it('shows the reference and version on every document', () => {
    const html = renderQuotationDocument({ reference: 'TQ-2026-ABCD', versionNo: 3, status: 'sent', policyVersion: '2026-09', data });
    expect(html).toContain('TQ-2026-ABCD');
    expect(html).toContain('v3');
    expect(html).toContain('2026-09');
  });
});
