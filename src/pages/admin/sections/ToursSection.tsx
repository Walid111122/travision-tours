import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Copy, Archive, ArchiveRestore, Eye, Plus, RotateCcw } from 'lucide-react';
import {
  adminFetch, type CmsTourSummary, type MediaAsset, type RevisionEntry, type SessionInfo
} from '../api';
import {
  ActionButton, ErrorBanner, Field, inputClass, Modal,
  SectionCard, StatusAnnouncer, StatusPill, Toolbar
} from '../components';
import MediaPickerModal from './MediaPickerModal';

/**
 * Tours & trips editor.
 *
 * Field-spec driven: TOUR_FIELD_SPECS declares every editable column, its
 * control and whether it is required. JSON columns (itinerary etc.) are
 * edited as formatted JSON with a parse check before save — nothing is sent
 * to the API that is not valid.
 */

type Kind = 'text' | 'textarea' | 'list' | 'json' | 'number' | 'checkbox' | 'select' | 'media';

interface FieldSpec {
  key: string;
  label: string;
  kind: Kind;
  required?: boolean;
  options?: readonly string[];
  hint?: string;
  group: string;
}

const TOUR_FIELD_SPECS: FieldSpec[] = [
  { key: 'title', label: 'Title', kind: 'text', required: true, group: 'Basics' },
  { key: 'collection', label: 'Collection', kind: 'select', options: ['package', 'day_tour'], required: true, group: 'Basics' },
  { key: 'destination', label: 'Destination', kind: 'text', group: 'Basics' },
  { key: 'category', label: 'Category', kind: 'select', options: ['cultural', 'historical', 'adventure', 'spiritual'], group: 'Basics' },
  { key: 'duration', label: 'Duration', kind: 'text', group: 'Basics' },
  { key: 'availability_label', label: 'Availability label', kind: 'text', hint: 'e.g. "Daily" — leave empty if not sourced.', group: 'Basics' },
  { key: 'display_order', label: 'Display order', kind: 'number', group: 'Basics' },
  { key: 'featured', label: 'Featured on homepage', kind: 'checkbox', group: 'Basics' },

  { key: 'price', label: 'Starting price (per person)', kind: 'number', hint: 'Indicative estimate only — final price is set per quotation.', group: 'Pricing' },
  { key: 'currency', label: 'Currency', kind: 'text', required: true, hint: 'ISO code, e.g. USD.', group: 'Pricing' },

  { key: 'short_description', label: 'Short description', kind: 'textarea', required: true, hint: 'Used on cards and listings.', group: 'Content' },
  { key: 'full_description', label: 'Full description', kind: 'textarea', group: 'Content' },
  { key: 'highlights', label: 'Highlights', kind: 'list', hint: 'One per line.', group: 'Content' },
  { key: 'itinerary', label: 'Day-by-day itinerary', kind: 'json', hint: 'JSON array of ItineraryItem objects.', group: 'Content' },
  { key: 'inclusions', label: 'Inclusions', kind: 'list', group: 'Content' },
  { key: 'exclusions', label: 'Exclusions', kind: 'list', group: 'Content' },
  { key: 'related_tours', label: 'Related tours', kind: 'list', hint: 'Tour IDs, one per line.', group: 'Content' },

  { key: 'pickup_info', label: 'Pickup / drop-off', kind: 'textarea', group: 'Operations' },
  { key: 'meeting_point', label: 'Meeting point', kind: 'text', group: 'Operations' },
  { key: 'operating_days', label: 'Operating days', kind: 'text', group: 'Operations' },
  { key: 'accessibility', label: 'Accessibility', kind: 'textarea', hint: 'Only sourced statements — otherwise leave empty.', group: 'Operations' },
  { key: 'child_info', label: 'Child information', kind: 'textarea', hint: 'General wording only — reservation-specific child policy lives in the quotation.', group: 'Operations' },
  { key: 'accommodation_info', label: 'Accommodation info', kind: 'textarea', group: 'Operations' },
  { key: 'notes', label: 'Practical notes', kind: 'textarea', group: 'Operations' },

  { key: 'cover_image', label: 'Cover image', kind: 'media', required: true, group: 'Media & SEO' },
  { key: 'gallery', label: 'Gallery', kind: 'list', hint: 'Image paths, one per line — ordered.', group: 'Media & SEO' },
  { key: 'map_url', label: 'Map embed URL', kind: 'text', group: 'Media & SEO' },
  { key: 'seo_title', label: 'SEO title', kind: 'text', group: 'Media & SEO' },
  { key: 'meta_description', label: 'Meta description', kind: 'textarea', group: 'Media & SEO' },
  { key: 'canonical_path', label: 'Canonical path', kind: 'text', group: 'Media & SEO' },
  { key: 'og_image', label: 'Open Graph image', kind: 'media', group: 'Media & SEO' },
  { key: 'source_notes', label: 'Source / evidence notes', kind: 'textarea', hint: 'Internal only — never rendered publicly.', group: 'Media & SEO' }
];

const GROUPS = ['Basics', 'Pricing', 'Content', 'Operations', 'Media & SEO'];

type TourRow = CmsTourSummary & Record<string, unknown>;

function rowToDraft(row: TourRow): Record<string, unknown> {
  const draft: Record<string, unknown> = {};
  for (const spec of TOUR_FIELD_SPECS) {
    const value = row[spec.key];
    if (spec.kind === 'list' || spec.kind === 'json') {
      try {
        const parsed = JSON.parse(String(value ?? '[]'));
        draft[spec.key] = spec.kind === 'list' ? (parsed as string[]).join('\n') : JSON.stringify(parsed, null, 2);
      } catch {
        draft[spec.key] = spec.kind === 'list' ? '' : '[]';
      }
    } else if (spec.kind === 'checkbox') {
      draft[spec.key] = Boolean(value);
    } else {
      draft[spec.key] = value ?? '';
    }
  }
  return draft;
}

function draftToFields(specs: FieldSpec[], draft: Record<string, unknown>): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  for (const spec of specs) {
    const raw = draft[spec.key];
    if (spec.kind === 'list') {
      fields[spec.key] = String(raw ?? '').split('\n').map(line => line.trim()).filter(Boolean);
    } else if (spec.kind === 'json') {
      const text = String(raw ?? '').trim() || '[]';
      fields[spec.key] = JSON.parse(text); // throws → caught by caller
    } else if (spec.kind === 'number') {
      fields[spec.key] = raw === '' || raw === null ? (spec.key === 'price' ? null : 0) : Number(raw);
    } else if (spec.kind === 'checkbox') {
      fields[spec.key] = raw ? 1 : 0;
    } else {
      fields[spec.key] = String(raw ?? '');
    }
  }
  return fields;
}

export default function ToursSection({ session: _session }: { session: SessionInfo }) {
  const [tours, setTours] = useState<CmsTourSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [collectionFilter, setCollectionFilter] = useState('');
  const [sortTitle, setSortTitle] = useState(false);
  const [error, setError] = useState('');
  const [announce, setAnnounce] = useState('');

  const [editing, setEditing] = useState<TourRow | null>(null);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [isNew, setIsNew] = useState(false);
  const [newId, setNewId] = useState('');
  const [summary, setSummary] = useState('');
  const [warnings, setWarnings] = useState<{ field: string; message: string }[]>([]);
  const [revisions, setRevisions] = useState<RevisionEntry[]>([]);
  const [previewRevision, setPreviewRevision] = useState<string | null>(null);
  const [mediaPickerFor, setMediaPickerFor] = useState<string | null>(null);
  const [inquiryRefs, setInquiryRefs] = useState(0);
  const [busy, setBusy] = useState(false);

  const PAGE_SIZE = 25;

  const load = useCallback(async () => {
    setError('');
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(page * PAGE_SIZE) });
    if (q.trim()) params.set('q', q.trim());
    if (statusFilter) params.set('status', statusFilter);
    if (collectionFilter) params.set('collection', collectionFilter);
    if (sortTitle) params.set('sort', 'title');
    try {
      const result = await adminFetch<{ tours: CmsTourSummary[]; total: number }>(`/tours?${params}`);
      setTours(result.tours);
      setTotal(result.total);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load tours.');
    }
  }, [page, q, statusFilter, collectionFilter, sortTitle]);

  useEffect(() => {
    void load();
  }, [load]);

  const openEditor = async (id: string) => {
    setBusy(true);
    setError('');
    try {
      const result = await adminFetch<{ tour: TourRow; inquiryReferences: number }>(`/tours/${encodeURIComponent(id)}`);
      setEditing(result.tour);
      setDraft(rowToDraft(result.tour));
      setIsNew(false);
      setInquiryRefs(result.inquiryReferences);
      setSummary('');
      setWarnings([]);
      const revs = await adminFetch<{ revisions: RevisionEntry[] }>(`/tours/${encodeURIComponent(id)}/revisions`);
      setRevisions(revs.revisions);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load the tour.');
    } finally {
      setBusy(false);
    }
  };

  const startCreate = () => {
    setEditing({ id: '' } as TourRow);
    setDraft({ currency: 'USD', collection: 'package', category: 'cultural', itinerary: '[]' });
    setNewId('');
    setIsNew(true);
    setRevisions([]);
    setInquiryRefs(0);
    setWarnings([]);
  };

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    setError('');
    try {
      const fields = draftToFields(TOUR_FIELD_SPECS, draft);
      if (isNew) {
        const result = await adminFetch<{ tour: { id: string } }>('/tours', {
          method: 'POST',
          body: JSON.stringify({ id: newId.trim(), fields })
        });
        setAnnounce(`Draft ${result.tour.id} created.`);
        setEditing(null);
        void load();
      } else {
        const result = await adminFetch<{ tour: { revision: number }; warnings?: { field: string; message: string }[] }>(
          `/tours/${encodeURIComponent(editing.id)}`,
          { method: 'PUT', body: JSON.stringify({ fields, expectedRevision: editing.revision, summary }) }
        );
        setEditing({ ...editing, ...fields, revision: result.tour.revision } as TourRow);
        setWarnings(result.warnings ?? []);
        setAnnounce('Saved as a new revision.');
        const revs = await adminFetch<{ revisions: RevisionEntry[] }>(`/tours/${encodeURIComponent(editing.id)}/revisions`);
        setRevisions(revs.revisions);
        void load();
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (status: string) => {
    if (!editing) return;
    setBusy(true);
    setError('');
    try {
      await adminFetch(`/tours/${encodeURIComponent(editing.id)}/status`, {
        method: 'POST',
        body: JSON.stringify({ status, expectedRevision: editing.revision })
      });
      setAnnounce(`Tour marked ${status}.`);
      setEditing({ ...editing, status } as TourRow);
      void load();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Status change failed.');
    } finally {
      setBusy(false);
    }
  };

  const duplicate = async () => {
    if (!editing) return;
    setBusy(true);
    try {
      const result = await adminFetch<{ tour: { id: string } }>(
        `/tours/${encodeURIComponent(editing.id)}/duplicate`, { method: 'POST' }
      );
      setAnnounce(`Duplicated to ${result.tour.id}.`);
      setEditing(null);
      void load();
    } catch (dupError) {
      setError(dupError instanceof Error ? dupError.message : 'Duplicate failed.');
      setBusy(false);
    }
  };

  const viewRevision = async (revisionNo: number) => {
    if (!editing) return;
    try {
      const result = await adminFetch<{ revision: { snapshot: string } }>(
        `/tours/${encodeURIComponent(editing.id)}/revisions/${revisionNo}`
      );
      setPreviewRevision(result.revision.snapshot);
    } catch {
      setError('Could not load that revision.');
    }
  };

  const restoreRevision = async (revisionNo: number) => {
    if (!editing) return;
    setBusy(true);
    try {
      const result = await adminFetch<{ tour: { revision: number } }>(
        `/tours/${encodeURIComponent(editing.id)}/restore`,
        { method: 'POST', body: JSON.stringify({ revisionNo, expectedRevision: editing.revision }) }
      );
      setAnnounce(`Restored revision ${revisionNo}.`);
      await openEditor(editing.id);
      setEditing(prev => (prev ? { ...prev, revision: result.tour.revision } : prev));
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : 'Restore failed.');
      setBusy(false);
    }
  };

  const groups = useMemo(() => GROUPS, []);

  // ------------------------- editor view -------------------------
  if (editing) {
    return (
      <div>
        <StatusAnnouncer message={announce} />
        <ErrorBanner message={error} />
        <Toolbar>
          <ActionButton onClick={() => setEditing(null)}>← Back to list</ActionButton>
          {!isNew && (
            <>
              <span className="text-xs text-egypt-papyrus/50">
                revision {editing.revision} · <StatusPill status={String(editing.status)} />
              </span>
              <ActionButton onClick={duplicate} disabled={busy}><Copy size={12} className="inline mr-1" />Duplicate</ActionButton>
              {editing.status !== 'published' && (
                <ActionButton variant="primary" onClick={() => void changeStatus('published')} disabled={busy}>
                  Approve for release
                </ActionButton>
              )}
              {editing.status === 'published' && (
                <ActionButton onClick={() => void changeStatus('draft')} disabled={busy}>Unpublish</ActionButton>
              )}
              {editing.status !== 'archived' ? (
                <ActionButton variant="danger" onClick={() => void changeStatus('archived')} disabled={busy}>
                  <Archive size={12} className="inline mr-1" />Archive
                </ActionButton>
              ) : (
                <ActionButton onClick={() => void changeStatus('draft')} disabled={busy}>
                  <ArchiveRestore size={12} className="inline mr-1" />Restore to draft
                </ActionButton>
              )}
            </>
          )}
        </Toolbar>

        {inquiryRefs > 0 && (
          <p className="mb-4 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
            {inquiryRefs} inquiry record(s) reference this tour. Its id is permanent; archive rather
            than delete, and never repurpose the id for different content.
          </p>
        )}

        {isNew && (
          <SectionCard title="New tour identity">
            <Field label="Tour ID" required hint="Lowercase slug — becomes the public URL /tours/<id>. Cannot be changed later.">
              <input className={inputClass} value={newId} onChange={e => setNewId(e.target.value)} placeholder="my-new-tour" />
            </Field>
          </SectionCard>
        )}

        {groups.map(group => (
          <div key={group}>
          <SectionCard title={group}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TOUR_FIELD_SPECS.filter(spec => spec.group === group).map(spec => {
                const value = draft[spec.key];
                if (spec.kind === 'checkbox') {
                  return (
                    <label key={spec.key} className="flex items-center gap-2 text-sm text-egypt-papyrus/80">
                      <input
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={e => setDraft({ ...draft, [spec.key]: e.target.checked })}
                        className="accent-egypt-gold"
                      />
                      {spec.label}
                    </label>
                  );
                }
                return (
                  <div key={spec.key} className={spec.kind === 'textarea' || spec.kind === 'list' || spec.kind === 'json' ? 'md:col-span-2' : ''}>
                    <Field label={spec.label} required={spec.required} hint={spec.hint}>
                      {spec.kind === 'select' ? (
                        <select
                          className={inputClass}
                          value={String(value ?? '')}
                          onChange={e => setDraft({ ...draft, [spec.key]: e.target.value })}
                        >
                          {spec.options?.map(option => <option key={option} value={option}>{option}</option>)}
                        </select>
                      ) : spec.kind === 'media' ? (
                        <div className="flex gap-2">
                          <input
                            className={inputClass}
                            value={String(value ?? '')}
                            onChange={e => setDraft({ ...draft, [spec.key]: e.target.value })}
                            placeholder="/images/… or media object"
                          />
                          <ActionButton onClick={() => setMediaPickerFor(spec.key)}>Browse</ActionButton>
                        </div>
                      ) : spec.kind === 'textarea' || spec.kind === 'list' || spec.kind === 'json' ? (
                        <textarea
                          className={`${inputClass} font-mono text-xs`}
                          rows={spec.kind === 'json' ? 8 : 4}
                          value={String(value ?? '')}
                          onChange={e => setDraft({ ...draft, [spec.key]: e.target.value })}
                        />
                      ) : (
                        <input
                          type={spec.kind === 'number' ? 'number' : 'text'}
                          className={inputClass}
                          value={String(value ?? '')}
                          onChange={e => setDraft({ ...draft, [spec.key]: e.target.value })}
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

        <SectionCard title="Save">
          <Field label="Change summary" hint="Recorded in the revision history and audit log.">
            <input className={inputClass} value={summary} onChange={e => setSummary(e.target.value)} placeholder="What changed?" />
          </Field>
          {warnings.length > 0 && (
            <ul className="mt-3 space-y-1 text-[11px] text-amber-300">
              {warnings.map((warning, i) => <li key={i}>{warning.field}: {warning.message}</li>)}
            </ul>
          )}
          <div className="mt-4 flex gap-2">
            <ActionButton variant="primary" onClick={() => void save()} disabled={busy}>
              {isNew ? 'Create draft' : 'Save new revision'}
            </ActionButton>
            <ActionButton onClick={() => setEditing(null)}>Cancel</ActionButton>
          </div>
        </SectionCard>

        {!isNew && (
          <SectionCard title={`Revision history (${revisions.length})`}>
            <ul className="space-y-2 text-xs">
              {revisions.map(rev => (
                <li key={rev.revision_no} className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-2">
                  <span className="font-mono text-egypt-gold">r{rev.revision_no}</span>
                  {editing.published_revision_no === rev.revision_no && (
                    <span className="text-[9px] uppercase tracking-widest text-emerald-300">release-approved</span>
                  )}
                  <span className="text-egypt-papyrus/60">{rev.actor} · {rev.created_at}</span>
                  <span className="text-egypt-papyrus/80">{rev.summary}</span>
                  <span className="ml-auto flex gap-1">
                    <ActionButton onClick={() => void viewRevision(rev.revision_no)}><Eye size={11} className="inline mr-1" />View</ActionButton>
                    <ActionButton onClick={() => void restoreRevision(rev.revision_no)} disabled={busy}>
                      <RotateCcw size={11} className="inline mr-1" />Restore
                    </ActionButton>
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {previewRevision && (
          <Modal title="Revision snapshot" onClose={() => setPreviewRevision(null)} wide>
            <pre className="text-[11px] text-egypt-papyrus/80 whitespace-pre-wrap break-all bg-black/30 rounded-lg p-4 max-h-[60vh] overflow-auto">
              {JSON.stringify(JSON.parse(previewRevision), null, 2)}
            </pre>
          </Modal>
        )}

        {mediaPickerFor && (
          <MediaPickerModal
            onPick={(asset: MediaAsset) => {
              setDraft({ ...draft, [mediaPickerFor]: asset.url });
              setMediaPickerFor(null);
            }}
            onClose={() => setMediaPickerFor(null)}
          />
        )}
      </div>
    );
  }

  // ------------------------- list view -------------------------
  return (
    <div>
      <StatusAnnouncer message={announce} />
      <ErrorBanner message={error} />
      <Toolbar>
        <form
          className="flex gap-2 flex-grow"
          onSubmit={event => { event.preventDefault(); setPage(0); void load(); }}
        >
          <input
            className={`${inputClass} flex-grow`}
            placeholder="Search title, id or destination…"
            value={q}
            onChange={e => setQ(e.target.value)}
            aria-label="Search tours"
          />
          <ActionButton variant="primary" onClick={() => { setPage(0); void load(); }}>
            <Search size={12} className="inline" />
          </ActionButton>
        </form>
        <select
          className={`${inputClass} w-auto`}
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select
          className={`${inputClass} w-auto`}
          value={collectionFilter}
          onChange={e => { setCollectionFilter(e.target.value); setPage(0); }}
          aria-label="Filter by collection"
        >
          <option value="">All collections</option>
          <option value="package">Packages</option>
          <option value="day_tour">Day tours</option>
        </select>
        <ActionButton onClick={() => setSortTitle(s => !s)}>
          Sort: {sortTitle ? 'title' : 'updated'}
        </ActionButton>
        <ActionButton variant="primary" onClick={startCreate}>
          <Plus size={12} className="inline mr-1" />New tour
        </ActionButton>
      </Toolbar>

      <p className="mb-3 text-[11px] text-egypt-papyrus/50">{total} tour(s)</p>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-widest text-egypt-papyrus/50 border-b border-white/10">
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Collection</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2 hidden md:table-cell">Updated</th>
            </tr>
          </thead>
          <tbody>
            {tours.map(tour => (
              <tr
                key={tour.id}
                className="border-b border-white/5 hover:bg-white/5 cursor-pointer"
                onClick={() => void openEditor(tour.id)}
              >
                <td className="px-3 py-2">
                  <p className="text-white">{tour.title}</p>
                  <p className="text-[10px] font-mono text-egypt-papyrus/50">{tour.id}</p>
                </td>
                <td className="px-3 py-2 text-xs">{tour.collection === 'day_tour' ? 'Day tour' : 'Package'}</td>
                <td className="px-3 py-2"><StatusPill status={tour.status} /></td>
                <td className="px-3 py-2 text-xs">{tour.price !== null ? `${tour.currency} ${tour.price}` : '—'}</td>
                <td className="px-3 py-2 text-[11px] text-egypt-papyrus/50 hidden md:table-cell">
                  {tour.updated_at?.slice(0, 16).replace('T', ' ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tours.length === 0 && (
          <p className="px-4 py-6 text-sm text-egypt-papyrus/50">
            No tours match. Run <code>npm run cms:seed</code> if the CMS is empty.
          </p>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <ActionButton disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</ActionButton>
        <ActionButton disabled={(page + 1) * PAGE_SIZE >= total} onClick={() => setPage(p => p + 1)}>Next →</ActionButton>
      </div>
    </div>
  );
}
