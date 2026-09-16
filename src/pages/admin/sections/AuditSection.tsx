import React, { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { adminFetch, type AuditEntry, type SessionInfo } from '../api';
import { ActionButton, ErrorBanner, inputClass, SectionCard, Toolbar } from '../components';

/**
 * The append-only administrative audit trail. There is deliberately no UI to
 * edit or remove entries — the table only accepts inserts from the API.
 */
export default function AuditSection({ session: _session }: { session: SessionInfo }) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [entityType, setEntityType] = useState('');
  const [entityId, setEntityId] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    const params = new URLSearchParams({ limit: '200' });
    if (entityType) params.set('entity_type', entityType);
    if (entityId.trim()) params.set('entity_id', entityId.trim());
    try {
      const result = await adminFetch<{ audit: AuditEntry[] }>(`/audit?${params}`);
      setEntries(result.audit);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load the audit log.');
    }
  }, [entityType, entityId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SectionCard title={`Administrative audit log (${entries.length})`}>
      <ErrorBanner message={error} />
      <Toolbar>
        <select
          className={`${inputClass} w-auto`}
          value={entityType}
          onChange={e => setEntityType(e.target.value)}
          aria-label="Filter by entity type"
        >
          <option value="">All entities</option>
          <option value="tour">Tours</option>
          <option value="post">Posts</option>
          <option value="quotation">Quotations</option>
          <option value="inquiry">Inquiries</option>
          <option value="media">Media</option>
        </select>
        <input
          className={`${inputClass} w-64`}
          placeholder="Entity id…"
          value={entityId}
          onChange={e => setEntityId(e.target.value)}
          aria-label="Filter by entity id"
        />
        <ActionButton onClick={() => void load()}><Search size={12} className="inline" /></ActionButton>
      </Toolbar>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-widest text-egypt-papyrus/50 border-b border-white/10">
              <th className="px-2 py-2">When</th>
              <th className="px-2 py-2">Actor</th>
              <th className="px-2 py-2">Action</th>
              <th className="px-2 py-2">Entity</th>
              <th className="px-2 py-2">Summary</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr key={index} className="border-b border-white/5">
                <td className="px-2 py-2 text-egypt-papyrus/50 whitespace-nowrap">{entry.created_at?.slice(0, 19).replace('T', ' ')}</td>
                <td className="px-2 py-2 text-egypt-papyrus/70">{entry.actor}</td>
                <td className="px-2 py-2 font-mono text-egypt-gold">{entry.action}</td>
                <td className="px-2 py-2">
                  <span className="text-egypt-papyrus/70">{entry.entity_type}</span>{' '}
                  <span className="font-mono text-[10px] text-egypt-papyrus/50">{entry.entity_id.slice(0, 24)}</span>
                </td>
                <td className="px-2 py-2 text-egypt-papyrus/80">{entry.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && !error && (
          <p className="px-2 py-6 text-sm text-egypt-papyrus/60">No audit events recorded yet.</p>
        )}
      </div>
    </SectionCard>
  );
}
