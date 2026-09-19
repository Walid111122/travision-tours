import React, { useCallback, useEffect, useState } from 'react';
import { Search, RefreshCw, AlertTriangle, ChevronRight, Download, FilePlus } from 'lucide-react';
import { adminFetch, type SessionInfo } from '../api';
import {
  ActionButton, ErrorBanner, inputClass, SectionCard, StatusAnnouncer, Toolbar
} from '../components';

/**
 * Inquiry review — the booking records submitted through the public site.
 * Personal data stays inside the authenticated session; the API never returns
 * IP addresses or tokens, and internal notes are private to administrators.
 */

type BookingSummary = {
  id: string;
  reference: string;
  status: string;
  tour_id: string;
  tour_title: string;
  customer_name: string;
  customer_email: string;
  preferred_date: string;
  travelers: number;
  inquiry_source: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

type BookingDetail = {
  booking: BookingSummary & {
    customer_phone: string | null;
    customer_country: string | null;
    departure_date: string | null;
    adults: number;
    children: number;
    child_ages: string | null;
    requirements: string | null;
    accommodation_preference: string | null;
    contact_preference: string | null;
    budget_range: string | null;
    referral_source: string | null;
    inquiry_policy_version: string | null;
    payment_recipient: string | null;
  };
  history: { status: string; note: string | null; actor: string | null; created_at: string }[];
  itinerary: { position: number; stop_id: string; stop_title: string; stop_location: string }[];
  notifications: {
    id: number; channel: string; status: string; attempts: number;
    last_error: string | null; created_at: string; updated_at: string; sent_at: string | null;
  }[];
  notes: { id: number; note: string; actor: string; created_at: string }[];
  quotations: { id: string; reference: string; status: string; version_no: number; updated_at: string }[];
};

const STATUSES = [
  'new', 'quoted', 'awaiting_transfer', 'payment_verification', 'confirmed', 'cancelled'
] as const;

export default function InquiriesSection({ session }: { session: SessionInfo }) {
  const [reference, setReference] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [note, setNote] = useState('');
  const [assignee, setAssignee] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [announce, setAnnounce] = useState('');

  const loadBookings = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (reference.trim()) params.set('reference', reference.trim());
      if (statusFilter) params.set('status', statusFilter);
      const result = await adminFetch<{ bookings: BookingSummary[] }>(`/bookings?${params}`);
      setBookings(result.bookings);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load inquiries.');
    } finally {
      setBusy(false);
    }
  }, [reference, statusFilter]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const openDetail = async (id: string) => {
    setBusy(true);
    setError('');
    try {
      const result = await adminFetch<BookingDetail>(`/bookings/${encodeURIComponent(id)}`);
      setDetail(result);
      setAssignee(result.booking.assigned_to ?? '');
      setNote('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load the inquiry.');
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (id: string, status: string) => {
    setBusy(true);
    setError('');
    try {
      await adminFetch(`/bookings/${encodeURIComponent(id)}/status`, {
        method: 'POST', body: JSON.stringify({ status })
      });
      setAnnounce(`Inquiry marked ${status}.`);
      await openDetail(id);
      await loadBookings();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Could not change the status.');
      setBusy(false);
    }
  };

  const addNote = async () => {
    if (!detail || !note.trim()) return;
    setBusy(true);
    try {
      await adminFetch(`/bookings/${encodeURIComponent(detail.booking.id)}/notes`, {
        method: 'POST', body: JSON.stringify({ note })
      });
      setAnnounce('Internal note added.');
      setNote('');
      await openDetail(detail.booking.id);
    } catch (noteError) {
      setError(noteError instanceof Error ? noteError.message : 'Could not add the note.');
      setBusy(false);
    }
  };

  const saveAssignee = async () => {
    if (!detail) return;
    setBusy(true);
    try {
      await adminFetch(`/bookings/${encodeURIComponent(detail.booking.id)}/assign`, {
        method: 'POST', body: JSON.stringify({ assignee: assignee || null })
      });
      setAnnounce('Assignment updated.');
      await openDetail(detail.booking.id);
    } catch (assignError) {
      setError(assignError instanceof Error ? assignError.message : 'Could not assign.');
      setBusy(false);
    }
  };

  const createQuotation = async () => {
    if (!detail) return;
    setBusy(true);
    try {
      const result = await adminFetch<{ quotation: { id: string; reference: string } }>(
        '/quotations',
        { method: 'POST', body: JSON.stringify({ bookingId: detail.booking.id }) }
      );
      setAnnounce(`Quotation ${result.quotation.reference} drafted.`);
      window.location.hash = 'quotations';
    } catch (quotationError) {
      setError(quotationError instanceof Error ? quotationError.message : 'Could not create the quotation.');
      setBusy(false);
    }
  };

  const retryNotification = async (notificationId: number) => {
    setBusy(true);
    setError('');
    try {
      await adminFetch(`/notifications/${notificationId}/retry`, { method: 'POST' });
      if (detail) await openDetail(detail.booking.id);
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : 'Could not retry the notification.');
      setBusy(false);
    }
  };

  return (
    <div>
      <StatusAnnouncer message={announce} />
      <ErrorBanner message={error} />

      <Toolbar>
        <form
          className="flex gap-2 flex-grow"
          onSubmit={event => { event.preventDefault(); void loadBookings(); }}
        >
          <input
            value={reference}
            onChange={event => setReference(event.target.value)}
            placeholder="Find by reference, e.g. TV-20260914-XXXXXXXX"
            aria-label="Booking reference"
            className={`${inputClass} flex-grow`}
          />
          <ActionButton variant="primary" onClick={() => void loadBookings()} disabled={busy}>
            <Search size={12} className="inline" />
          </ActionButton>
        </form>
        <select
          className={`${inputClass} w-auto`}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
        </select>
        <ActionButton onClick={() => { setReference(''); setStatusFilter(''); }} disabled={busy}>
          <RefreshCw size={12} className="inline" />
        </ActionButton>
      </Toolbar>

      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard title={`${bookings.length} ${bookings.length === 1 ? 'match' : 'matches'}`}>
          <ul className="space-y-2 max-h-[70vh] overflow-y-auto">
            {bookings.map(booking => (
              <li key={booking.id}>
                <button
                  type="button"
                  onClick={() => void openDetail(booking.id)}
                  className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 transition-colors focus:outline-none focus:ring-1 focus:ring-egypt-gold/60"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs text-egypt-gold">{booking.reference}</span>
                    <span className="text-[10px] uppercase tracking-widest text-egypt-papyrus/60">{booking.status}</span>
                  </div>
                  <p className="mt-1 text-sm text-white">{booking.customer_name}</p>
                  <p className="text-xs text-egypt-papyrus/50">{booking.tour_title}</p>
                  <p className="mt-1 text-[10px] text-egypt-papyrus/60">
                    {booking.preferred_date} · {booking.travelers} traveler(s)
                    {booking.assigned_to ? ` · ${booking.assigned_to}` : ''}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </SectionCard>

        <div>
          {!detail ? (
            <p className="text-sm text-egypt-papyrus/60">Select an inquiry to see its detail.</p>
          ) : (
            <div className="space-y-5">
              <SectionCard
                title={detail.booking.reference}
                actions={
                  <a
                    href={`/api/admin/bookings/${encodeURIComponent(detail.booking.id)}/export`}
                    download
                    className="flex items-center gap-1 text-[10px] uppercase font-black tracking-widest text-egypt-gold hover:text-white"
                  >
                    <Download size={12} /> Export
                  </a>
                }
              >
                <dl className="grid grid-cols-2 gap-3 text-xs">
                  {[
                    ['Status', detail.booking.status],
                    ['Tour', detail.booking.tour_title],
                    ['Customer', detail.booking.customer_name],
                    ['Email', detail.booking.customer_email],
                    ['Phone', detail.booking.customer_phone ?? '—'],
                    ['Country', detail.booking.customer_country ?? '—'],
                    ['Preferred date', detail.booking.preferred_date],
                    ['Departure date', detail.booking.departure_date ?? '—'],
                    ['Travelers', String(detail.booking.travelers)],
                    ['Adults / children', `${detail.booking.adults} / ${detail.booking.children}`],
                    ['Child ages', detail.booking.child_ages ?? '—'],
                    ['Accommodation', detail.booking.accommodation_preference ?? '—'],
                    ['Contact preference', detail.booking.contact_preference ?? '—'],
                    ['Budget', detail.booking.budget_range ?? '—'],
                    ['Referral', detail.booking.referral_source ?? '—'],
                    ['Payment recipient', detail.booking.payment_recipient ?? '—'],
                    ['Assigned to', detail.booking.assigned_to ?? '—'],
                    ['Policy version', detail.booking.inquiry_policy_version ?? '—']
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-egypt-papyrus/60 uppercase tracking-widest text-[9px]">{label}</dt>
                      <dd className="text-white break-words">{value}</dd>
                    </div>
                  ))}
                </dl>
                {detail.booking.requirements && (
                  <div className="mt-4">
                    <p className="text-egypt-papyrus/60 uppercase tracking-widest text-[9px]">Special requirements</p>
                    <p className="text-white text-xs whitespace-pre-wrap">{detail.booking.requirements}</p>
                  </div>
                )}
              </SectionCard>

              {detail.itinerary.length > 0 && (
                <SectionCard title="Requested itinerary">
                  <ol className="space-y-1 text-xs text-white">
                    {detail.itinerary.map(item => (
                      <li key={item.position} className="flex items-center gap-2">
                        <ChevronRight size={12} className="text-egypt-gold" />
                        {item.position}. {item.stop_title}
                        <span className="text-egypt-papyrus/60">({item.stop_location})</span>
                      </li>
                    ))}
                  </ol>
                </SectionCard>
              )}

              <SectionCard title="Status">
                <div className="flex flex-wrap gap-2">
                  {STATUSES.filter(status => status !== detail.booking.status).map(status => (
                    <ActionButton
                      key={status}
                      onClick={() => void changeStatus(detail.booking.id, status)}
                      disabled={busy}
                    >
                      {status}
                    </ActionButton>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Quotations">
                {detail.quotations.length === 0 ? (
                  <p className="text-xs text-egypt-papyrus/60">No quotation yet.</p>
                ) : (
                  <ul className="space-y-1 text-xs">
                    {detail.quotations.map(quotation => (
                      <li key={quotation.id} className="flex items-center gap-2">
                        <span className="font-mono text-egypt-gold">{quotation.reference}</span>
                        <span className="text-egypt-papyrus/60">v{quotation.version_no} · {quotation.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3">
                  <ActionButton variant="primary" onClick={() => void createQuotation()} disabled={busy}>
                    <FilePlus size={12} className="inline mr-1" />Draft quotation from this inquiry
                  </ActionButton>
                </div>
              </SectionCard>

              <SectionCard title="Internal notes">
                <ul className="space-y-2 text-xs mb-3">
                  {detail.notes.map(entry => (
                    <li key={entry.id} className="bg-white/5 rounded-lg px-3 py-2">
                      <p className="text-white whitespace-pre-wrap">{entry.note}</p>
                      <p className="text-egypt-papyrus/50 mt-1">{entry.actor} · {entry.created_at}</p>
                    </li>
                  ))}
                  {detail.notes.length === 0 && (
                    <li className="text-egypt-papyrus/50">No internal notes yet.</li>
                  )}
                </ul>
                <div className="flex gap-2">
                  <input
                    className={`${inputClass} flex-grow`}
                    placeholder="Private note — never sent to the customer"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    aria-label="Internal note"
                  />
                  <ActionButton onClick={() => void addNote()} disabled={busy || !note.trim()}>Add</ActionButton>
                </div>
              </SectionCard>

              <SectionCard title="Assignment">
                <div className="flex gap-2">
                  <input
                    className={`${inputClass} flex-grow`}
                    placeholder="operator@example.com"
                    value={assignee}
                    onChange={e => setAssignee(e.target.value)}
                    aria-label="Assign to operator"
                  />
                  <ActionButton onClick={() => void saveAssignee()} disabled={busy}>Assign</ActionButton>
                </div>
              </SectionCard>

              <SectionCard title="Audit history">
                <ul className="space-y-2 text-xs text-white">
                  {detail.history.map((entry, index) => (
                    <li key={`${entry.status}-${index}`}>
                      <span className="text-egypt-gold">{entry.status}</span>
                      <span className="text-egypt-papyrus/60"> · {entry.actor ?? 'unknown'} · {entry.created_at}</span>
                      {entry.note && <p className="text-egypt-papyrus/60">{entry.note}</p>}
                    </li>
                  ))}
                </ul>
              </SectionCard>

              <SectionCard title="Operator notifications">
                {detail.notifications.length === 0 ? (
                  <p className="text-xs text-egypt-papyrus/60">No notification rows.</p>
                ) : (
                  <ul className="space-y-3 text-xs">
                    {detail.notifications.map(notification => (
                      <li key={notification.id} className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-white">
                            {notification.channel} · <span className="text-egypt-gold">{notification.status}</span>
                            <span className="text-egypt-papyrus/60"> · {notification.attempts} attempt(s)</span>
                          </p>
                          {notification.last_error && (
                            <p className="text-red-400 flex items-center gap-1 mt-1">
                              <AlertTriangle size={12} /> {notification.last_error}
                            </p>
                          )}
                        </div>
                        {notification.status !== 'sent' && (
                          <ActionButton onClick={() => void retryNotification(notification.id)} disabled={busy}>
                            Retry
                          </ActionButton>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            </div>
          )}
        </div>
      </div>
      <p className="sr-only">Signed in as {session.email}</p>
    </div>
  );
}
