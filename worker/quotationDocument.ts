import { PAYMENT_PARTNER_NAME, SITE_NAME } from '../src/config/business';
import type { QuotationData } from '../src/config/quotation';

/**
 * Print-ready quotation & policy document renderer.
 *
 * This is the dynamic twin of templates/quotation-policy-template.html — the
 * same sections, order and wording, but populated from a stored quotation and
 * escaped on every value so customer-typed text can never break out into
 * markup. `internal_notes` is never passed in and can never appear here.
 *
 * The endpoint is served only inside the authenticated admin session; the
 * administrator prints it to PDF and emails it before any payment is taken.
 */

function esc(value: string | null | undefined): string {
  return (value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\n/g, '<br>');
}

function field(value: string | null | undefined, fallback = 'To be confirmed for this quotation.'): string {
  const text = (value ?? '').trim();
  if (!text) return `<span class="placeholder">${esc(fallback)}</span>`;
  return esc(text);
}

function money(value: string, _currency: string): string {
  const text = value.trim();
  if (!text) return `<span class="placeholder">To be confirmed for this quotation.</span>`;
  return esc(text);
}

export function renderQuotationDocument(options: {
  reference: string;
  versionNo: number;
  status: string;
  policyVersion: string;
  data: QuotationData;
}): string {
  const { reference, versionNo, status, policyVersion, data } = options;
  const currency = data.currency || 'USD';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Quotation &amp; Policy — ${esc(reference)}</title>
<style>
  :root { --ink:#1c1917; --muted:#57534e; --accent:#8a6d2f; --line:#d6d3cd; --placeholder:#fef3c7; }
  * { box-sizing: border-box; }
  body { font-family: Georgia,'Times New Roman',serif; color:var(--ink); margin:0 auto;
         max-width:800px; padding:40px 32px; font-size:13px; line-height:1.5; }
  h1 { font-size:22px; letter-spacing:2px; margin:0; text-transform:uppercase; }
  h2 { font-size:13px; letter-spacing:1.5px; text-transform:uppercase; color:var(--accent);
       border-bottom:1px solid var(--line); padding-bottom:4px; margin:28px 0 10px; }
  p { margin:6px 0; }
  table { width:100%; border-collapse:collapse; margin:8px 0; }
  th,td { border:1px solid var(--line); padding:6px 10px; text-align:left; vertical-align:top; }
  th { font-size:11px; letter-spacing:1px; text-transform:uppercase; color:var(--muted); width:34%; }
  .placeholder { background:var(--placeholder); padding:0 4px; border-radius:3px; font-style:italic; }
  .head { display:flex; justify-content:space-between; align-items:flex-start;
          border-bottom:3px solid var(--accent); padding-bottom:16px; }
  .head .brand { font-size:11px; letter-spacing:3px; text-transform:uppercase; color:var(--muted); }
  .note { background:#f5f5f4; border-left:3px solid var(--accent); padding:10px 14px; margin:10px 0; }
  .accept { border:1px solid var(--ink); padding:14px; margin-top:28px; }
  .sig { display:flex; gap:40px; margin-top:24px; }
  .sig div { flex:1; border-top:1px solid var(--ink); padding-top:6px; font-size:11px; color:var(--muted); }
  .docmeta { font-size:10px; color:var(--muted); margin-top:32px; border-top:1px solid var(--line); padding-top:8px; }
  .status-banner { background:#fde68a; border:1px solid #b45309; padding:8px 12px; margin:12px 0;
                   font-weight:bold; text-transform:uppercase; letter-spacing:1px; font-size:11px; }
  @media print {
    body { padding:0; max-width:none; }
    h2 { page-break-after: avoid; }
    .accept { page-break-inside: avoid; }
    @page { margin: 18mm 14mm; @bottom-right { content: "Page " counter(page) " of " counter(pages); font-size:10px; color:#57534e; } }
    .status-banner { display:none; }
  }
</style>
</head>
<body>

${status !== 'sent' && status !== 'approved' ? `<div class="status-banner">Internal draft — status: ${esc(status)} — do not send to the customer in this state</div>` : ''}

<header class="head">
  <div>
    <p class="brand">${esc(SITE_NAME)} — customer-facing inquiries</p>
    <h1>Quotation &amp; Reservation Policy</h1>
  </div>
  <div style="text-align:right">
    <p><strong>Quotation No.:</strong> ${esc(reference)}</p>
    <p><strong>Document version:</strong> v${versionNo}</p>
    <p><strong>Issue date:</strong> ${field(data.issueDate)}</p>
    <p><strong>Offer valid until:</strong> ${field(data.expirationDate)}</p>
  </div>
</header>

<p class="note">
  This document contains the personalized price and the reservation-specific
  policies that apply to this booking only. Please review every section before
  deciding whether to proceed. Payment is made directly to
  <strong>${esc(PAYMENT_PARTNER_NAME)}</strong>, the operating and
  payment-receiving partner — never to ${esc(SITE_NAME)} and never through the
  website.
</p>

<h2>Customer</h2>
<table>
  <tr><th>Name</th><td>${field(data.customerName)}</td></tr>
  <tr><th>Email</th><td>${field(data.customerEmail)}</td></tr>
  <tr><th>Phone / WhatsApp</th><td>${field(data.customerPhone)}</td></tr>
  <tr><th>Inquiry reference</th><td>${field(data.inquiryReference, 'Direct quotation')}</td></tr>
</table>

<h2>Travel arrangements</h2>
<table>
  <tr><th>Travel dates</th><td>${field(data.travelDates)}</td></tr>
  <tr><th>Adults (12+)</th><td>${field(data.adults)}</td></tr>
  <tr><th>Children (ages)</th><td>${field(data.childrenAges, 'None')}</td></tr>
  <tr><th>Pickup / meeting point</th><td>${field(data.pickupMeeting)}</td></tr>
</table>

<h2>Itinerary</h2>
<p>${field(data.itinerary)}</p>

<h2>Accommodation</h2>
<table>
  <tr><th>Selected hotel(s) / cruise</th><td>${field(data.hotelSelection)}</td></tr>
  <tr><th>Room type &amp; occupancy</th><td>${field(data.roomTypeOccupancy)}</td></tr>
  <tr><th>Meal basis</th><td>${field(data.mealBasis)}</td></tr>
  <tr><th>Hotel child policy</th><td>${field(data.hotelChildPolicy, 'Insert current hotel child policy.')}</td></tr>
  <tr><th>Child &amp; infant pricing</th><td>${field(data.childInfantPricing)}</td></tr>
</table>

<h2>Price</h2>
<table>
  <tr><th>Total price</th><td>${money(data.totalPrice, currency)}</td></tr>
  <tr><th>Price breakdown</th><td>${field(data.priceBreakdown)}</td></tr>
  <tr><th>Deposit</th><td>${money(data.depositAmount, currency)}</td></tr>
  <tr><th>Balance &amp; deadline</th><td>${field(data.balanceAndDeadline)}</td></tr>
  <tr><th>Currency</th><td>${esc(currency)}</td></tr>
</table>

<h2>Payment</h2>
<table>
  <tr><th>Payment recipient</th><td>${esc(PAYMENT_PARTNER_NAME)}</td></tr>
  <tr><th>Accepted methods for this quotation</th><td>${field(data.paymentMethods)}</td></tr>
  <tr><th>Payment instructions</th><td>${field(data.paymentInstructions, 'Issued privately after acceptance; verify the beneficiary is ' + PAYMENT_PARTNER_NAME + '.')}</td></tr>
</table>

<h2>Cancellation &amp; refund policy — this reservation</h2>
<table>
  <tr><th>Cancellation schedule</th><td>${field(data.cancellationSchedule, 'Insert reservation-specific cancellation schedule.')}</td></tr>
  <tr><th>Amendment conditions</th><td>${field(data.amendmentTerms)}</td></tr>
  <tr><th>No-show policy</th><td>${field(data.noShowPolicy)}</td></tr>
  <tr><th>Unused services</th><td>${field(data.unusedServicesPolicy)}</td></tr>
  <tr><th>Special-event / supplier conditions</th><td>${field(data.specialConditions, 'None apply')}</td></tr>
</table>

<h2>Inclusions</h2>
<p>${field(data.inclusions)}</p>

<h2>Exclusions</h2>
<p>${field(data.exclusions)}</p>

<h2>Optional services</h2>
<p>${field(data.optionalServices, 'None offered')}</p>

<h2>Special requests noted</h2>
<p>${field(data.specialRequests, 'None recorded')}</p>

${data.customerNotes?.trim() ? `<h2>Notes</h2>\n<p>${esc(data.customerNotes)}</p>` : ''}

<h2>Customer acceptance</h2>
<div class="accept">
  <p>
    I confirm that I have received and reviewed this quotation and the
    reservation-specific policies above — including the total price, selected
    accommodation, applicable child policy and child prices, and the
    cancellation and refund schedule for this booking — before making any
    payment. I understand that payment is made directly to
    ${esc(PAYMENT_PARTNER_NAME)} and that my reservation is confirmed only
    after these conditions are accepted, payment requirements are completed,
    and written confirmation is issued.
  </p>
  <div class="sig">
    <div>Customer signature / date</div>
    <div>For ${esc(PAYMENT_PARTNER_NAME)} / date</div>
  </div>
</div>

<h2>Document</h2>
<table>
  <tr><th>Policy / quotation version</th><td>${esc(policyVersion || `v${versionNo}`)}</td></tr>
  <tr><th>Operating &amp; payment partner</th><td>${esc(PAYMENT_PARTNER_NAME)} — ${field(data.eotContactDetails)}</td></tr>
  <tr><th>Prepared by</th><td>${esc(SITE_NAME)} on behalf of ${esc(PAYMENT_PARTNER_NAME)} — ${field(data.preparedBy, 'Reservations team')}</td></tr>
</table>

<p class="docmeta">Reference ${esc(reference)} · document version v${versionNo} · generated ${esc(new Date().toISOString().slice(0, 10))}. This document is valid only with the issue date and offer-expiration date shown above.</p>

</body>
</html>`;
}
