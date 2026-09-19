# Quotation & Policy Operations

How an inquiry becomes a confirmed reservation. Nothing is automatic — every
step is an explicit, audited administrator action.

## The flow

```
inquiry → draft → ready_for_review → approved → sent → accepted
        → awaiting_payment → paid → confirmed
```

Terminal side-exits: `declined`, `expired`, `cancelled` (from any active
state). The state machine lives in `src/config/quotation.ts`
(`QUOTATION_TRANSITIONS`) and is enforced server-side — the UI only offers
legal transitions.

## Creating a quotation

- **From an inquiry**: Inquiries → open the inquiry → *Draft quotation*.
  Customer details, dates, traveler counts, tour title, and requirements are
  prefilled from the booking record.
- **Blank**: Quotations → *New quotation*.

The reference is generated (`TQ-YYYYMMDD-XXXXXXXX`) and cannot be reused.

## Fields

Every document field is a named, labeled input grouped like the printed
document (`src/config/quotation.ts` `QUOTATION_FIELDS`). Required fields must
contain real values — empty fields or placeholder markers (`[ ]`, "to be
confirmed", "insert", "tbd") block the `ready_for_review` transition with a
`placeholders_unresolved` error listing exactly what is missing.

Notable required groups: customer identity, travel dates, traveler/children
ages, pickup, final itinerary, hotel selection + room/occupancy/meal basis,
**hotel-specific child policy**, child/infant pricing, total + breakdown +
deposit + balance, payment recipient/methods/instructions, reservation-specific
cancellation schedule, amendment/no-show/unused-services/supplier terms,
inclusions/exclusions, and partner contact details.

## The customer document

`GET /api/admin/quotations/:id/document` renders the print-ready HTML
(`worker/quotationDocument.ts` — a server-side port of
`templates/quotation-policy-template.html` with all values escaped). Open it
from the quotation row, then **Print → Save as PDF** and email it manually —
the mailbox phase is deferred, so sending is a controlled manual step.

Guarantees:

- Internal notes are structurally excluded — the renderer cannot see them.
- Payment goes to **Egypt Online Tour** — enforced: `ready_for_review`
  rejects any other `paymentRecipient` (`payment_recipient_invalid`).
- Unresolved values render as visible "To be confirmed" markers, never blank.
- A non-sent document is watermarked *Internal draft*.
- Page footer carries reference + document version.

## Marking sent

*Mark as sent* records `sent_at`, `sent_by`, and `sent_version_no` — the exact
document version the customer received. Afterwards the version is **frozen**:
editing returns `version_locked`. To change a sent quotation use *New
version*, which increments `version_no`, resets the document to `draft`, and
restarts the review chain.

## Acceptance, payment, confirmation

- `accepted` requires `acceptanceMethod` (e.g. "email reply dated …") and
  optionally `acceptanceEvidence` — recorded with a timestamp.
- `awaiting_payment` → `paid` records `payment_received_at`. Payment itself
  happens directly with Egypt Online Tour — Travision Tours never collects.
- `confirmed` is reachable **only** from `paid` and records `confirmed_at` +
  the confirming administrator. Written confirmation is issued after payment,
  per the business model.

## History

`quotation_status_history` records every transition with actor + note;
`quotation_revisions` snapshots every save. Both surface in the quotation
detail view and the Revisions/Audit sections.

## Deferred

Email delivery, e-signature provider integration, and any payment links are
domain-phase work. Do not mark anything sent/accepted/paid that did not
actually happen — the audit log records who did.
