import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { adminFetch, type AuditEntry, type OverviewCounts, type SessionInfo } from '../api';
import { ErrorBanner, SectionCard, StatusAnnouncer } from '../components';

interface OverviewResponse {
  counts: OverviewCounts;
  recentActions: AuditEntry[];
  inquiryPolicyVersion: string;
  paymentPartner: string;
}

function CountTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <p className="text-2xl font-serif text-white">{value}</p>
      <p className="mt-1 text-[10px] uppercase font-black tracking-widest text-egypt-papyrus/50">{label}</p>
    </div>
  );
}

export default function DashboardSection({ session }: { session: SessionInfo }) {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [error, setError] = useState('');
  const [announce, setAnnounce] = useState('');

  const load = async () => {
    setError('');
    try {
      setData(await adminFetch<OverviewResponse>('/overview'));
      setAnnounce('Dashboard refreshed.');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load the overview.');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <StatusAnnouncer message={announce} />
      <ErrorBanner message={error} />

      {!data ? (
        <p className="text-sm text-egypt-papyrus/60">Loading overview…</p>
      ) : (
        <>
          <SectionCard
            title="Content"
            actions={
              <button
                type="button"
                onClick={() => void load()}
                className="flex items-center gap-1 text-[10px] uppercase font-black tracking-widest text-egypt-gold hover:text-white"
              >
                <RefreshCw size={12} /> Refresh
              </button>
            }
          >
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <CountTile label="Published tours" value={data.counts.toursPublished} />
              <CountTile label="Draft tours" value={data.counts.toursDraft} />
              <CountTile label="Archived tours" value={data.counts.toursArchived} />
              <CountTile label="Published posts" value={data.counts.postsPublished} />
              <CountTile label="Draft posts" value={data.counts.postsDraft} />
              <CountTile label="Scheduled posts" value={data.counts.postsScheduled} />
            </div>
          </SectionCard>

          <SectionCard title="Pipeline">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <CountTile label="New inquiries" value={data.counts.newInquiries} />
              <CountTile label="Quotations: draft" value={data.counts.quotationsDraft} />
              <CountTile label="Ready for review" value={data.counts.quotationsReady} />
              <CountTile label="Sent to customer" value={data.counts.quotationsSent} />
              <CountTile label="Accepted" value={data.counts.quotationsAccepted} />
              <CountTile label="Awaiting payment" value={data.counts.quotationsAwaitingPayment} />
              <CountTile label="Confirmed" value={data.counts.confirmedReservations} />
              <CountTile label="Missing fields" value={data.counts.contentMissingFields} />
              <CountTile label="Media assets" value={data.counts.activeMedia} />
            </div>
            <p className="mt-4 text-[11px] text-egypt-papyrus/50">
              A "published" CMS row means <em>approved for the next content release</em> — the
              public site changes only after <code>cms:export</code>, a rebuild, and a separate
              deployment. Saved drafts are never live.
            </p>
          </SectionCard>

          <SectionCard title="Recent administrative actions">
            {data.recentActions.length === 0 ? (
              <p className="text-sm text-egypt-papyrus/50">No actions recorded yet.</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {data.recentActions.map((entry, index) => (
                  <li key={index} className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-egypt-gold font-mono">{entry.action}</span>
                    <span className="text-white">{entry.entity_type} {entry.entity_id.slice(0, 18)}</span>
                    <span className="text-egypt-papyrus/50">{entry.actor} · {entry.created_at}</span>
                    {entry.summary && <span className="text-egypt-papyrus/60">— {entry.summary}</span>}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Readiness">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-egypt-papyrus/50 uppercase tracking-widest text-[9px]">Environment</dt>
                <dd className="text-white">{session.environment}</dd>
              </div>
              <div>
                <dt className="text-egypt-papyrus/50 uppercase tracking-widest text-[9px]">Inquiry policy version</dt>
                <dd className="text-white font-mono">{data.inquiryPolicyVersion}</dd>
              </div>
              <div>
                <dt className="text-egypt-papyrus/50 uppercase tracking-widest text-[9px]">Payment partner</dt>
                <dd className="text-white">{data.paymentPartner}</dd>
              </div>
              <div>
                <dt className="text-egypt-papyrus/50 uppercase tracking-widest text-[9px]">CMS → export → deploy</dt>
                <dd className="text-white">Domain phase — see CMS_PUBLISHING_WORKFLOW.md</dd>
              </div>
            </dl>
          </SectionCard>
        </>
      )}
    </div>
  );
}
