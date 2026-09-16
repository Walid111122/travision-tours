import React, { useEffect, useState } from 'react';
import { adminFetch, type RevisionEntry, type SessionInfo } from '../api';
import { ErrorBanner, SectionCard } from '../components';

/**
 * Cross-entity revision stream — every content save appends a snapshot. Open
 * the entity in its own section to view or restore a specific revision.
 */
export default function RevisionsSection({ session: _session }: { session: SessionInfo }) {
  const [revisions, setRevisions] = useState<RevisionEntry[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    adminFetch<{ revisions: RevisionEntry[] }>('/revisions?limit=200')
      .then(result => setRevisions(result.revisions))
      .catch(loadError => setError(loadError instanceof Error ? loadError.message : 'Could not load revisions.'));
  }, []);

  return (
    <SectionCard title={`All revisions (${revisions.length})`}>
      <ErrorBanner message={error} />
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-widest text-egypt-papyrus/50 border-b border-white/10">
              <th className="px-2 py-2">Entity</th>
              <th className="px-2 py-2">Revision</th>
              <th className="px-2 py-2">Summary</th>
              <th className="px-2 py-2">Actor</th>
              <th className="px-2 py-2">When</th>
            </tr>
          </thead>
          <tbody>
            {revisions.map((rev, index) => (
              <tr key={index} className="border-b border-white/5">
                <td className="px-2 py-2">
                  <span className="text-egypt-gold">{rev.entity_type}</span>{' '}
                  <span className="font-mono text-[10px] text-egypt-papyrus/60">{rev.entity_id?.slice(0, 24)}</span>
                </td>
                <td className="px-2 py-2 font-mono">r{rev.revision_no}{rev.version_no ? ` · v${rev.version_no}` : ''}</td>
                <td className="px-2 py-2 text-egypt-papyrus/80">{rev.summary || '—'}</td>
                <td className="px-2 py-2 text-egypt-papyrus/60">{rev.actor}</td>
                <td className="px-2 py-2 text-egypt-papyrus/50">{rev.created_at?.slice(0, 16).replace('T', ' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {revisions.length === 0 && !error && (
          <p className="px-2 py-6 text-sm text-egypt-papyrus/60">No revisions recorded yet.</p>
        )}
      </div>
      <p className="mt-3 text-[11px] text-egypt-papyrus/50">
        To compare or restore a revision, open the entity in Tours, Blog or Quotations and use its
        revision history panel.
      </p>
    </SectionCard>
  );
}
