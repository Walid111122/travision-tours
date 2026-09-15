import React, { useCallback, useEffect, useState } from 'react';
import { Lock, Search, RefreshCw, AlertTriangle, ChevronRight } from 'lucide-react';
import SEO from '../components/SEO';

/**
 * Operator lead-review view.
 *
 * This page holds no data of its own: every request goes to `/api/admin/*`,
 * which requires a verified Cloudflare Access identity. An unauthorised visitor
 * cannot enumerate bookings because the endpoints themselves refuse them.
 *
 * All user-supplied values are rendered as text through React, never as HTML.
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
    id: number;
    channel: string;
    status: string;
    attempts: number;
    last_error: string | null;
    created_at: string;
    updated_at: string;
    sent_at: string | null;
  }[];
};

const STATUSES = [
  'new',
  'quoted',
  'awaiting_transfer',
  'payment_verification',
  'confirmed',
  'cancelled'
] as const;

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/admin${path}`, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...init
  });

  const body = (await response.json().catch(() => null)) as
    | (T & { error?: { message?: string } })
    | null;

  if (!response.ok) {
    throw new Error(body?.error?.message || `Request failed with status ${response.status}.`);
  }

  return body as T;
}

/**
 * Every state of this page is noindex, so one description serves all three.
 * `SEO` requires one: without it the document ships a `content`-less meta
 * description, which the prerender check rejects.
 */
const ADMIN_DESCRIPTION =
  'Operator-only lead review for Travision Tours. Access requires an approved Cloudflare Access account.';

const Admin = () => {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [operator, setOperator] = useState('');
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [detail, setDetail] = useState<BookingDetail | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    adminFetch<{ authorized: boolean; email: string }>('/session')
      .then(session => {
        setAuthorized(true);
        setOperator(session.email);
      })
      .catch(() => setAuthorized(false));
  }, []);

  const loadBookings = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      const query = reference.trim() ? `?reference=${encodeURIComponent(reference.trim())}` : '';
      const result = await adminFetch<{ bookings: BookingSummary[] }>(`/bookings${query}`);
      setBookings(result.bookings);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load bookings.');
    } finally {
      setBusy(false);
    }
  }, [reference]);

  useEffect(() => {
    if (authorized) void loadBookings();
  }, [authorized, loadBookings]);

  const openDetail = async (id: string) => {
    setBusy(true);
    setError('');
    try {
      setDetail(await adminFetch<BookingDetail>(`/bookings/${encodeURIComponent(id)}`));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load the booking.');
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (id: string, status: string) => {
    setBusy(true);
    setError('');
    try {
      await adminFetch(`/bookings/${encodeURIComponent(id)}/status`, {
        method: 'POST',
        body: JSON.stringify({ status })
      });
      await openDetail(id);
      await loadBookings();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Could not change the status.');
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

  if (authorized === null) {
    // This is the branch the prerenderer captures, so it has to carry the
    // document's title, description and robots tag as well as a real heading —
    // otherwise /admin ships a head with no metadata and no crawlable content.
    return (
      <div className="pt-32 pb-20 px-6 max-w-3xl mx-auto text-center text-egypt-papyrus/60">
        <SEO title="Operator access" description={ADMIN_DESCRIPTION} canonical="/admin" noIndex />
        <h1 className="text-3xl font-serif uppercase mb-4 text-egypt-papyrus">Operator access</h1>
        <p className="font-light leading-relaxed">Checking operator access…</p>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="pt-32 pb-20 px-6 max-w-3xl mx-auto text-center">
        <SEO title="Operator access" description={ADMIN_DESCRIPTION} canonical="/admin" noIndex />
        <Lock className="mx-auto mb-6 text-egypt-gold" size={40} />
        <h1 className="text-3xl font-serif uppercase mb-4">Operator access required</h1>
        <p className="text-egypt-papyrus/60 font-light leading-relaxed">
          This area is protected by Cloudflare Access. Sign in with an approved operator account to
          review inquiries.
        </p>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-6 max-w-6xl mx-auto">
      <SEO title="Operator lead review" description={ADMIN_DESCRIPTION} canonical="/admin" noIndex />

      <header className="mb-10">
        <p className="text-[10px] uppercase font-black tracking-widest text-egypt-gold mb-3">
          Operator lead review
        </p>
        <h1 className="text-4xl font-serif uppercase">Booking inquiries</h1>
        <p className="mt-3 text-sm text-egypt-papyrus/50">Signed in as {operator}</p>
      </header>

      <form
        className="flex flex-wrap gap-3 mb-8"
        onSubmit={event => {
          event.preventDefault();
          void loadBookings();
        }}
      >
        <input
          value={reference}
          onChange={event => setReference(event.target.value)}
          placeholder="Find by reference, e.g. TV-20260914-XXXXXXXX"
          aria-label="Booking reference"
          className="flex-grow min-w-[260px] bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-egypt-gold"
        />
        <button
          type="submit"
          disabled={busy}
          className="px-6 py-3 rounded-xl bg-egypt-gold text-egypt-night font-black uppercase text-[10px] tracking-widest disabled:opacity-50 flex items-center gap-2"
        >
          <Search size={14} /> Search
        </button>
        <button
          type="button"
          onClick={() => {
            setReference('');
            void loadBookings();
          }}
          disabled={busy}
          className="px-6 py-3 rounded-xl border border-white/10 font-black uppercase text-[10px] tracking-widest disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw size={14} /> Reset
        </button>
      </form>

      {error && (
        <p role="alert" className="mb-6 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        <section aria-label="Inquiries">
          <h2 className="text-xs uppercase font-black tracking-widest text-egypt-papyrus/50 mb-4">
            {bookings.length} inquiry {bookings.length === 1 ? 'match' : 'matches'}
          </h2>
          <ul className="space-y-2">
            {bookings.map(booking => (
              <li key={booking.id}>
                <button
                  type="button"
                  onClick={() => void openDetail(booking.id)}
                  className="w-full text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-xs text-egypt-gold">{booking.reference}</span>
                    <span className="text-[10px] uppercase tracking-widest text-egypt-papyrus/60">
                      {booking.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-white">{booking.customer_name}</p>
                  <p className="text-xs text-egypt-papyrus/50">{booking.tour_title}</p>
                  <p className="mt-1 text-[10px] text-egypt-papyrus/60">
                    {booking.preferred_date} · {booking.travelers} traveler(s) ·{' '}
                    {booking.inquiry_source ?? 'tour'}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Inquiry detail">
          {!detail ? (
            <p className="text-sm text-egypt-papyrus/60">Select an inquiry to see its detail.</p>
          ) : (
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="font-mono text-sm text-egypt-gold mb-4">{detail.booking.reference}</h2>
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
                    ['Payment recipient', detail.booking.payment_recipient ?? '—']
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-egypt-papyrus/60 uppercase tracking-widest text-[9px]">{label}</dt>
                      <dd className="text-white break-words">{value}</dd>
                    </div>
                  ))}
                </dl>
                {detail.booking.requirements && (
                  <div className="mt-4">
                    <p className="text-egypt-papyrus/60 uppercase tracking-widest text-[9px]">
                      Special requirements
                    </p>
                    <p className="text-white text-xs whitespace-pre-wrap">{detail.booking.requirements}</p>
                  </div>
                )}
              </div>

              {detail.itinerary.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-xs uppercase font-black tracking-widest text-egypt-papyrus/50 mb-3">
                    Requested itinerary
                  </h3>
                  <ol className="space-y-1 text-xs text-white">
                    {detail.itinerary.map(item => (
                      <li key={item.position} className="flex items-center gap-2">
                        <ChevronRight size={12} className="text-egypt-gold" />
                        {item.position}. {item.stop_title}
                        <span className="text-egypt-papyrus/60">({item.stop_location})</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-xs uppercase font-black tracking-widest text-egypt-papyrus/50 mb-3">
                  Change status
                </h3>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.filter(status => status !== detail.booking.status).map(status => (
                    <button
                      key={status}
                      type="button"
                      disabled={busy}
                      onClick={() => void changeStatus(detail.booking.id, status)}
                      className="px-4 py-2 rounded-xl border border-white/10 hover:border-egypt-gold text-[10px] uppercase tracking-widest disabled:opacity-50"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-xs uppercase font-black tracking-widest text-egypt-papyrus/50 mb-3">
                  Audit history
                </h3>
                <ul className="space-y-2 text-xs text-white">
                  {detail.history.map((entry, index) => (
                    <li key={`${entry.status}-${index}`}>
                      <span className="text-egypt-gold">{entry.status}</span>
                      <span className="text-egypt-papyrus/60">
                        {' '}
                        · {entry.actor ?? 'unknown'} · {entry.created_at}
                      </span>
                      {entry.note && <p className="text-egypt-papyrus/60">{entry.note}</p>}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-xs uppercase font-black tracking-widest text-egypt-papyrus/50 mb-3">
                  Operator notifications
                </h3>
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
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void retryNotification(notification.id)}
                            className="px-3 py-1 rounded-lg border border-white/10 hover:border-egypt-gold text-[10px] uppercase tracking-widest disabled:opacity-50"
                          >
                            Retry
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Admin;
