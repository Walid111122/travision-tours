import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Plus, ExternalLink, RotateCcw } from 'lucide-react';
import { adminFetch, type QuotationSummary, type RevisionEntry, type SessionInfo } from '../api';
import {
  ActionButton, ErrorBanner, Field, inputClass, SectionCard,
  StatusAnnouncer, StatusPill, Toolbar
} from '../components';
import { PAYMENT_PARTNER_NAME } from '../../../config/business';
import {
  QUOTATION_FIELDS, QUOTATION_STATUSES, QUOTATION_TRANSITIONS,
  IMMUTABLE_AFTER_SENT, type QuotationData
} from '../../../config/quotation';

/**
 * Quotation & policy workflow.
 *
 * The editor writes to `data` (customer-facing fields) and `internal_notes`
 * (never rendered into the customer document). Status moves only through the
 * explicit transition buttons; the server enforces the state machine and the
 * evidence requirements for sent/accepted/paid/confirmed.
 */

type QuotationDetail = {
  quotation: QuotationSummary & {
    data: QuotationData;
    internal_notes: string;
    policy_version: string;
    unresolved: (keyof QuotationData)[];
    accepted_at: string | null;
    acceptance_method: string | null;
    payment_received_at: string | null;
    confirmed_at: string | null;
  };
  history: { from_status: string; to_status: string; actor: string; note: string; created_at: string }[];
};

const FIELD_GROUPS: { title: string; keys: (keyof QuotationData)[] }[] = [
  { title: 'Customer', keys: ['customerName', 'customerEmail', 'customerPhone', 'inquiryReference'] },
  { title: 'Travel', keys: ['travelDates', 'adults', 'childrenAges', 'pickupMeeting', 'itinerary'] },
  { title: 'Accommodation', keys: ['hotelSelection', 'roomTypeOccupancy', 'mealBasis', 'hotelChildPolicy', 'childInfantPricing'] },
  { title: 'Price', keys: ['totalPrice', 'priceBreakdown', 'depositAmount', 'balanceAndDeadline', 'currency'] },
  { title: 'Payment', keys: ['paymentRecipient', 'paymentMethods', 'paymentInstructions'] },
  { title: 'Reservation policy', keys: ['cancellationSchedule', 'amendmentTerms', 'noShowPolicy', 'unusedServicesPolicy', 'specialConditions'] },
  { title: 'Scope', keys: ['inclusions', 'exclusions', 'optionalServices', 'specialRequests'] },
  { title: 'Document', keys: ['issueDate', 'expirationDate', 'eotContactDetails', 'preparedBy', 'customerNotes'] }
];

const TEXTAREA_KEYS = new Set<keyof QuotationData>([
  'itinerary', 'cancellationSchedule', 'amendmentTerms', 'inclusions',
  'exclusions', 'optionalServices', 'specialRequests', 'specialConditions',
  'priceBreakdown', 'hotelChildPolicy', 'customerNotes', 'paymentInstructions',
  'unusedServicesPolicy', 'noShowPolicy'
]);

const STATUS_ACTION_LABELS: Record<string, string> = {
  ready_for_review: 'Submit for review',
  approved: 'Approve internally',
  sent: 'Mark as sent',
  accepted: 'Customer accepted',
  awaiting_payment: 'Awaiting payment',
  paid: 'Payment received',
  confirmed: 'Confirm reservation',
  declined: 'Customer declined',
  expired: 'Mark expired',
  cancelled: 'Cancel',
  draft: 'Back to draft'
};

export default function QuotationsSection(_props: { session: SessionInfo }) {
  const [quotations, setQuotations] = useState<QuotationSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [announce, setAnnounce] = useState('');

  const [detail, setDetail] = useState<QuotationDetail | null>(null);
  const [data, setData] = useState<QuotationData | null>(null);
  const [internalNotes, setInternalNotes] = useState('');
  const [policyVersion, setPolicyVersion] = useState('');
  const [summary, setSummary] = useState('');
  const [revisions, setRevisions] = useState<RevisionEntry[]>([]);
  const [acceptMethod, setAcceptMethod] = useState('');
  const [acceptEvidence, setAcceptEvidence] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError('');
    const params = new URLSearchParams({ limit: '100' });
    if (q.trim()) params.set('q', q.trim());
    if (statusFilter) params.set('status', statusFilter);
    try {
      const result = await adminFetch<{ quotations: QuotationSummary[]; total: number }>(`/quotations?${params}`);
      setQuotations(result.quotations);
      setTotal(result.total);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load quotations.');
    }
  }, [q, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const openDetail = async (id: string) => {
    setBusy(true);
    setError('');
    try {
      const result = await adminFetch<QuotationDetail>(`/quotations/${encodeURIComponent(id)}`);
      setDetail(result);
      setData(result.quotation.data);
      setInternalNotes(result.quotation.internal_notes);
      setPolicyVersion(result.quotation.policy_version);
      setSummary('');
      setStatusNote('');
      setAcceptMethod(result.quotation.acceptance_method ?? '');
      setAcceptEvidence('');
      const revs = await adminFetch<{ revisions: RevisionEntry[] }>(`/quotations/${encodeURIComponent(id)}/revisions`);
      setRevisions(revs.revisions);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load the quotation.');
    } finally {
      setBusy(false);
    }
  };

  const createBlank = async () => {
    setBusy(true);
    try {
      const result = await adminFetch<{ quotation: { id: string } }>('/quotations', {
        method: 'POST', body: JSON.stringify({})
      });
      setAnnounce('Blank quotation drafted.');
      await openDetail(result.quotation.id);
      void load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Could not create the quotation.');
      setBusy(false);
    }
  };

  const save = async () => {
    if (!detail || !data) return;
    setBusy(true);
    setError('');
    try {
      const result = await adminFetch<{ quotation: { revision: number; unresolved: string[] } }>(
        `/quotations/${encodeURIComponent(detail.quotation.id)}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            data, internalNotes, policyVersion,
            expectedRevision: detail.quotation.revision, summary
          })
        }
      );
      setAnnounce('Saved.');
      await openDetail(detail.quotation.id);
      setDetail(prev => prev ? { ...prev, quotation: { ...prev.quotation, revision: result.quotation.revision } } : prev);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  };

  const transition = async (next: string) => {
    if (!detail) return;
    setBusy(true);
    setError('');
    try {
      const body: Record<string, unknown> = { status: next, note: statusNote };
      if (next === 'accepted') {
        body.acceptanceMethod = acceptMethod;
        body.acceptanceEvidence = acceptEvidence;
      }
      await adminFetch(`/quotations/${encodeURIComponent(detail.quotation.id)}/status`, {
        method: 'POST', body: JSON.stringify(body)
      });
      setAnnounce(`Quotation marked ${next.replace(/_/g, ' ')}.`);
      setStatusNote('');
      await openDetail(detail.quotation.id);
      void load();
    } catch (transitionError) {
      setError(transitionError instanceof Error ? transitionError.message : 'Transition failed.');
    } finally {
      setBusy(false);
    }
  };

  const revise = async () => {
    if (!detail) return;
    setBusy(true);
    try {
      await adminFetch(`/quotations/${encodeURIComponent(detail.quotation.id)}/revise`, { method: 'POST' });
      setAnnounce('Reopened as a new version — the approval cycle restarts.');
      await openDetail(detail.quotation.id);
      void load();
    } catch (reviseError) {
      setError(reviseError instanceof Error ? reviseError.message : 'Could not revise.');
      setBusy(false);
    }
  };

  const unresolved = useMemo(
    () => new Set(detail?.quotation.unresolved ?? []),
    [detail]
  );

  // ------------------------- detail/editor -------------------------
  if (detail && data) {
    const quotation = detail.quotation;
    const locked = IMMUTABLE_AFTER_SENT.includes(quotation.status as never);
    const nextStatuses = QUOTATION_TRANSITIONS[quotation.status as keyof typeof QUOTATION_TRANSITIONS] ?? [];

    return (
      <div>
        <StatusAnnouncer message={announce} />
        <ErrorBanner message={error} />
        <Toolbar>
          <ActionButton onClick={() => { setDetail(null); void load(); }}>← Back to list</ActionButton>
          <span className="font-mono text-egypt-gold text-sm">{quotation.reference}</span>
          <StatusPill status={quotation.status} />
          <span className="text-xs text-egypt-papyrus/50">document v{quotation.version_no} · row revision {quotation.revision}</span>
          <a
            href={`/api/admin/quotations/${encodeURIComponent(quotation.id)}/document`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-egypt-gold text-egypt-night text-[10px] font-black uppercase tracking-widest hover:bg-white"
          >
            <ExternalLink size={12} /> Open print-ready document
          </a>
          {locked && (
            <ActionButton onClick={() => void revise()} disabled={busy}>
              <RotateCcw size={12} className="inline mr-1" />New version
            </ActionButton>
          )}
        </Toolbar>

        {quotation.sent_at && (
          <p className="mb-4 text-[11px] text-egypt-papyrus/70 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
            Version {quotation.sent_version_no} was sent by {quotation.sent_at?.slice(0, 16).replace('T', ' ')} UTC.
            The customer-facing document is that frozen snapshot; edits require a new version.
          </p>
        )}

        {unresolved.size > 0 && (
          <div className="mb-4 bg-amber-500/10 border border-amber-500/40 rounded-xl px-4 py-3 text-xs text-amber-200">
            <p className="font-black uppercase tracking-widest text-[10px] mb-1">
              {unresolved.size} required field(s) still unresolved — blocks "Submit for review"
            </p>
            <p>{[...unresolved].join(', ')}</p>
          </div>
        )}

        {FIELD_GROUPS.map(group => (
          <div key={group.title}>
          <SectionCard title={group.title}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.keys.map(key => {
                const spec = QUOTATION_FIELDS.find(f => f.key === key)!;
                const wide = TEXTAREA_KEYS.has(key);
                const isUnresolved = unresolved.has(key);
                return (
                  <div key={key} className={wide ? 'md:col-span-2' : ''}>
                    <Field
                      label={spec.label + (isUnresolved ? ' — unresolved' : '')}
                      required={spec.required}
                    >
                      {wide ? (
                        <textarea
                          className={`${inputClass} text-xs ${isUnresolved ? 'border-amber-500/50' : ''}`}
                          rows={4}
                          disabled={locked}
                          value={data[key] ?? ''}
                          onChange={e => setData({ ...data, [key]: e.target.value })}
                        />
                      ) : (
                        <input
                          className={`${inputClass} ${isUnresolved ? 'border-amber-500/50' : ''}`}
                          disabled={locked || key === 'paymentRecipient'}
                          title={key === 'paymentRecipient' ? `Payments always go to ${PAYMENT_PARTNER_NAME}` : undefined}
                          value={data[key] ?? ''}
                          onChange={e => setData({ ...data, [key]: e.target.value })}
                        />
                      )}
                    </Field>
                  </div>
                );
              })}
            </div>
          </SectionCard>
          </div>
        ))}

        <SectionCard title="Internal notes — never in the customer PDF">
          <textarea
            className={`${inputClass} text-xs`}
            rows={3}
            disabled={locked}
            value={internalNotes}
            onChange={e => setInternalNotes(e.target.value)}
            aria-label="Internal notes"
          />
        </SectionCard>

        <SectionCard title="Policy version">
          <Field label="Policy / quotation version" hint="Recorded on the document, e.g. 2026-09.">
            <input
              className={inputClass}
              disabled={locked}
              value={policyVersion}
              onChange={e => setPolicyVersion(e.target.value)}
            />
          </Field>
        </SectionCard>

        {!locked && (
          <SectionCard title="Save">
            <Field label="Change summary">
              <input className={inputClass} value={summary} onChange={e => setSummary(e.target.value)} placeholder="What changed?" />
            </Field>
            <div className="mt-4">
              <ActionButton variant="primary" onClick={() => void save()} disabled={busy}>Save</ActionButton>
            </div>
          </SectionCard>
        )}

        <SectionCard title="Status actions">
          <Field label="Transition note (optional)">
            <input className={inputClass} value={statusNote} onChange={e => setStatusNote(e.target.value)} />
          </Field>
          {nextStatuses.includes('accepted') && (
            <div className="grid md:grid-cols-2 gap-4 mt-3">
              <Field label="Acceptance method" required hint='e.g. "email reply", "signed scan".'>
                <input className={inputClass} value={acceptMethod} onChange={e => setAcceptMethod(e.target.value)} />
              </Field>
              <Field label="Acceptance evidence note">
                <input className={inputClass} value={acceptEvidence} onChange={e => setAcceptEvidence(e.target.value)} />
              </Field>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {nextStatuses.map(next => (
              <ActionButton
                key={next}
                variant={['cancelled', 'declined', 'expired'].includes(next) ? 'danger' : 'primary'}
                onClick={() => void transition(next)}
                disabled={busy}
              >
                {STATUS_ACTION_LABELS[next] ?? next}
              </ActionButton>
            ))}
            {nextStatuses.length === 0 && (
              <p className="text-xs text-egypt-papyrus/50">Terminal status — no further transitions.</p>
            )}
          </div>
          <p className="mt-3 text-[11px] text-egypt-papyrus/50">
            Nothing here is automatic: "sent", "accepted", "paid" and "confirmed" are recorded by an
            administrator after they happen. The customer PDF is emailed manually — the mailbox is a
            domain-phase dependency.
          </p>
        </SectionCard>

        <SectionCard title={`Status history (${detail.history.length})`}>
          <ul className="space-y-1 text-xs">
            {detail.history.map((entry, index) => (
              <li key={index} className="flex flex-wrap gap-x-2">
                <span className="text-egypt-papyrus/60">{entry.created_at}</span>
                <span className="text-egypt-gold">{entry.from_status || '—'} → {entry.to_status}</span>
                <span className="text-egypt-papyrus/60">{entry.actor}</span>
                {entry.note && <span className="text-egypt-papyrus/80">— {entry.note}</span>}
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title={`Document versions (${revisions.length} revisions)`}>
          <ul className="space-y-1 text-xs">
            {revisions.map(rev => (
              <li key={rev.revision_no} className="flex flex-wrap gap-x-2">
                <span className="font-mono text-egypt-gold">r{rev.revision_no}</span>
                <span className="text-egypt-papyrus/60">v{rev.version_no} · {rev.status}</span>
                <span className="text-egypt-papyrus/60">{rev.actor} · {rev.created_at}</span>
                <span className="text-egypt-papyrus/80">{rev.summary}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    );
  }

  // ------------------------- list -------------------------
  return (
    <div>
      <StatusAnnouncer message={announce} />
      <ErrorBanner message={error} />
      <Toolbar>
        <form className="flex gap-2 flex-grow" onSubmit={event => { event.preventDefault(); void load(); }}>
          <input
            className={`${inputClass} flex-grow`}
            placeholder="Search by reference…"
            value={q}
            onChange={e => setQ(e.target.value)}
            aria-label="Search quotations"
          />
          <ActionButton variant="primary" onClick={() => void load()}><Search size={12} className="inline" /></ActionButton>
        </form>
        <select
          className={`${inputClass} w-auto`}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {QUOTATION_STATUSES.map(status => <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>)}
        </select>
        <ActionButton variant="primary" onClick={() => void createBlank()} disabled={busy}>
          <Plus size={12} className="inline mr-1" />New quotation
        </ActionButton>
      </Toolbar>

      <p className="mb-3 text-[11px] text-egypt-papyrus/50">{total} quotation(s)</p>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-widest text-egypt-papyrus/50 border-b border-white/10">
              <th className="px-3 py-2">Reference</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Version</th>
              <th className="px-3 py-2 hidden md:table-cell">Updated</th>
            </tr>
          </thead>
          <tbody>
            {quotations.map(quotation => (
              <tr
                key={quotation.id}
                className="border-b border-white/5 hover:bg-white/5 cursor-pointer"
                onClick={() => void openDetail(quotation.id)}
              >
                <td className="px-3 py-2 font-mono text-xs text-egypt-gold">{quotation.reference}</td>
                <td className="px-3 py-2 text-white">{quotation.customer_name || '—'}</td>
                <td className="px-3 py-2"><StatusPill status={quotation.status} /></td>
                <td className="px-3 py-2 text-xs">v{quotation.version_no}</td>
                <td className="px-3 py-2 text-[11px] text-egypt-papyrus/50 hidden md:table-cell">
                  {quotation.updated_at?.slice(0, 16).replace('T', ' ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {quotations.length === 0 && (
          <p className="px-4 py-6 text-sm text-egypt-papyrus/50">
            No quotations yet — draft one from an inquiry, or create a blank one.
          </p>
        )}
      </div>
    </div>
  );
}
