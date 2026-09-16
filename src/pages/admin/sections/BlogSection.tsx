import React, { useCallback, useEffect, useState } from 'react';
import { Search, Plus, Eye, RotateCcw, Archive, ArchiveRestore } from 'lucide-react';
import {
  adminFetch, type CmsPostSummary, type MediaAsset, type RevisionEntry, type SessionInfo
} from '../api';
import {
  ActionButton, ErrorBanner, Field, inputClass, Modal, SectionCard,
  StatusAnnouncer, StatusPill, Toolbar
} from '../components';
import { MarkdownContent } from '../../../components/Markdown';
import MediaPickerModal from './MediaPickerModal';

type PostRow = CmsPostSummary & Record<string, unknown>;

interface PostFieldSpec {
  key: string;
  label: string;
  kind: 'text' | 'textarea' | 'list' | 'markdown' | 'media';
  required?: boolean;
  hint?: string;
}

const POST_FIELDS: readonly PostFieldSpec[] = [
  { key: 'slug', label: 'Slug', kind: 'text', required: true, hint: 'Public URL: /blog/<slug>. Locked after publish — changing it requires a redirect confirmation.' },
  { key: 'title', label: 'Title', kind: 'text', required: true },
  { key: 'excerpt', label: 'Excerpt', kind: 'textarea', hint: 'Shown on cards and used as the default meta description (≤220 chars).', required: true },
  { key: 'author', label: 'Author', kind: 'text' },
  { key: 'cover_image', label: 'Cover image', kind: 'media' },
  { key: 'tags', label: 'Tags', kind: 'list', hint: 'One per line.' },
  { key: 'content', label: 'Body (markdown subset)', kind: 'markdown', required: true, hint: '## and ### headings, - lists, [text](/internal-path) links. Raw HTML is rejected.' },
  { key: 'seo_title', label: 'SEO title', kind: 'text' },
  { key: 'meta_description', label: 'Meta description', kind: 'textarea' },
  { key: 'og_image', label: 'Open Graph image', kind: 'media' },
  { key: 'source_notes', label: 'Source notes (internal)', kind: 'textarea' }
];

function rowToDraft(row: PostRow): Record<string, unknown> {
  const draft: Record<string, unknown> = {};
  for (const spec of POST_FIELDS) {
    const value = row[spec.key];
    draft[spec.key] = spec.key === 'tags'
      ? (() => { try { return (JSON.parse(String(value ?? '[]')) as string[]).join('\n'); } catch { return ''; } })()
      : value ?? '';
  }
  return draft;
}

export default function BlogSection({ session: _session }: { session: SessionInfo }) {
  const [posts, setPosts] = useState<CmsPostSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');
  const [announce, setAnnounce] = useState('');

  const [editing, setEditing] = useState<PostRow | null>(null);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [isNew, setIsNew] = useState(false);
  const [summary, setSummary] = useState('');
  const [redirectFrom, setRedirectFrom] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [warnings, setWarnings] = useState<{ field: string; message: string }[]>([]);
  const [revisions, setRevisions] = useState<RevisionEntry[]>([]);
  const [previewRevision, setPreviewRevision] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [mediaPickerFor, setMediaPickerFor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError('');
    const params = new URLSearchParams({ limit: '50' });
    if (q.trim()) params.set('q', q.trim());
    if (statusFilter) params.set('status', statusFilter);
    try {
      const result = await adminFetch<{ posts: CmsPostSummary[]; total: number }>(`/posts?${params}`);
      setPosts(result.posts);
      setTotal(result.total);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load posts.');
    }
  }, [q, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const openEditor = async (id: string) => {
    setBusy(true);
    setError('');
    try {
      const result = await adminFetch<{ post: PostRow }>(`/posts/${encodeURIComponent(id)}`);
      setEditing(result.post);
      setDraft(rowToDraft(result.post));
      setIsNew(false);
      setSummary('');
      setRedirectFrom('');
      setWarnings([]);
      setShowPreview(false);
      const revs = await adminFetch<{ revisions: RevisionEntry[] }>(`/posts/${encodeURIComponent(id)}/revisions`);
      setRevisions(revs.revisions);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load the post.');
    } finally {
      setBusy(false);
    }
  };

  const startCreate = () => {
    setEditing({ id: '' } as PostRow);
    setDraft({ author: 'Travision Tours', tags: '' });
    setIsNew(true);
    setRevisions([]);
    setWarnings([]);
    setShowPreview(false);
  };

  const buildFields = () => {
    const fields: Record<string, unknown> = {};
    for (const spec of POST_FIELDS) {
      const raw = draft[spec.key];
      fields[spec.key] = spec.key === 'tags'
        ? String(raw ?? '').split('\n').map(line => line.trim()).filter(Boolean)
        : String(raw ?? '');
    }
    return fields;
  };

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    setError('');
    try {
      const fields = buildFields();
      if (isNew) {
        await adminFetch('/posts', { method: 'POST', body: JSON.stringify({ fields }) });
        setAnnounce('Draft post created.');
        setEditing(null);
      } else {
        const body: Record<string, unknown> = { fields, expectedRevision: editing.revision, summary };
        if (redirectFrom) body.redirectFrom = redirectFrom;
        const result = await adminFetch<{ post: { revision: number }; warnings?: { field: string; message: string }[] }>(
          `/posts/${encodeURIComponent(editing.id)}`,
          { method: 'PUT', body: JSON.stringify(body) }
        );
        setEditing({ ...editing, ...fields, revision: result.post.revision } as PostRow);
        setWarnings(result.warnings ?? []);
        setAnnounce('Saved as a new revision.');
        const revs = await adminFetch<{ revisions: RevisionEntry[] }>(`/posts/${encodeURIComponent(editing.id)}/revisions`);
        setRevisions(revs.revisions);
      }
      void load();
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
      const body: Record<string, unknown> = { status, expectedRevision: editing.revision };
      if (status === 'scheduled') body.scheduledAt = scheduledAt;
      await adminFetch(`/posts/${encodeURIComponent(editing.id)}/status`, {
        method: 'POST', body: JSON.stringify(body)
      });
      setAnnounce(`Post marked ${status}.`);
      setEditing({ ...editing, status } as PostRow);
      void load();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Status change failed.');
    } finally {
      setBusy(false);
    }
  };

  const restoreRevision = async (revisionNo: number) => {
    if (!editing) return;
    setBusy(true);
    try {
      await adminFetch(`/posts/${encodeURIComponent(editing.id)}/restore`, {
        method: 'POST',
        body: JSON.stringify({ revisionNo, expectedRevision: editing.revision })
      });
      setAnnounce(`Restored revision ${revisionNo}.`);
      await openEditor(editing.id);
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : 'Restore failed.');
      setBusy(false);
    }
  };

  const viewRevision = async (revisionNo: number) => {
    if (!editing) return;
    try {
      const result = await adminFetch<{ revision: { snapshot: string } }>(
        `/posts/${encodeURIComponent(editing.id)}/revisions/${revisionNo}`
      );
      setPreviewRevision(result.revision.snapshot);
    } catch {
      setError('Could not load that revision.');
    }
  };

  if (editing) {
    const slugLocked = Boolean(editing.slug_locked);
    const slugChanged = !isNew && String(draft.slug ?? '') !== editing.slug;
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
              {editing.status !== 'published' && (
                <ActionButton variant="primary" onClick={() => void changeStatus('published')} disabled={busy}>
                  Approve for release
                </ActionButton>
              )}
              {editing.status !== 'scheduled' && (
                <>
                  <input
                    type="datetime-local"
                    aria-label="Schedule publication"
                    className={`${inputClass} w-auto text-xs`}
                    value={scheduledAt}
                    onChange={e => setScheduledAt(e.target.value)}
                  />
                  <ActionButton onClick={() => void changeStatus('scheduled')} disabled={busy || !scheduledAt}>
                    Schedule
                  </ActionButton>
                </>
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
          <ActionButton onClick={() => setShowPreview(p => !p)}>
            <Eye size={12} className="inline mr-1" />{showPreview ? 'Edit' : 'Preview'}
          </ActionButton>
        </Toolbar>

        {showPreview ? (
          <SectionCard title="Public rendering preview">
            <article className="prose-invert">
              <h1 className="font-serif text-3xl uppercase tracking-tight text-white">{String(draft.title || 'Untitled')}</h1>
              <p className="text-sm text-egypt-papyrus/60 mt-2">{String(draft.excerpt || '')}</p>
              <MarkdownContent content={String(draft.content || '')} />
            </article>
            <p className="mt-6 text-[11px] text-egypt-papyrus/50">
              This is the exact renderer the public /blog page uses — Article JSON-LD, canonical
              and meta are generated from the same fields at build time.
            </p>
          </SectionCard>
        ) : (
          <>
            {slugChanged && slugLocked && (
              <SectionCard title="Slug change confirmation">
                <p className="text-xs text-amber-300 mb-3">
                  This post is published — changing its slug creates a redirect so the old URL keeps
                  working. Type the current slug to confirm.
                </p>
                <Field label={`Type "${editing.slug}" to confirm the redirect`}>
                  <input className={inputClass} value={redirectFrom} onChange={e => setRedirectFrom(e.target.value)} />
                </Field>
              </SectionCard>
            )}

            <SectionCard title="Post fields">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {POST_FIELDS.map(spec => {
                  const value = draft[spec.key];
                  const wide = ['textarea', 'list', 'markdown'].includes(spec.kind);
                  return (
                    <div key={spec.key} className={wide ? 'md:col-span-2' : ''}>
                      <Field label={spec.label} required={spec.required} hint={spec.hint}>
                        {spec.kind === 'media' ? (
                          <div className="flex gap-2">
                            <input
                              className={inputClass}
                              value={String(value ?? '')}
                              onChange={e => setDraft({ ...draft, [spec.key]: e.target.value })}
                            />
                            <ActionButton onClick={() => setMediaPickerFor(spec.key)}>Browse</ActionButton>
                          </div>
                        ) : spec.kind === 'text' ? (
                          <input
                            className={inputClass}
                            value={String(value ?? '')}
                            onChange={e => setDraft({ ...draft, [spec.key]: e.target.value })}
                          />
                        ) : (
                          <textarea
                            className={`${inputClass} font-mono text-xs`}
                            rows={spec.kind === 'markdown' ? 16 : 4}
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

            <SectionCard title="Save">
              <Field label="Change summary">
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
          </>
        )}

        {!isNew && revisions.length > 0 && (
          <SectionCard title={`Revision history (${revisions.length})`}>
            <ul className="space-y-2 text-xs">
              {revisions.map(rev => (
                <li key={rev.revision_no} className="flex flex-wrap items-center gap-2 border-b border-white/5 pb-2">
                  <span className="font-mono text-egypt-gold">r{rev.revision_no}</span>
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

  return (
    <div>
      <StatusAnnouncer message={announce} />
      <ErrorBanner message={error} />
      <Toolbar>
        <form
          className="flex gap-2 flex-grow"
          onSubmit={event => { event.preventDefault(); void load(); }}
        >
          <input
            className={`${inputClass} flex-grow`}
            placeholder="Search title or slug…"
            value={q}
            onChange={e => setQ(e.target.value)}
            aria-label="Search posts"
          />
          <ActionButton variant="primary" onClick={() => void load()}>
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
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="archived">Archived</option>
        </select>
        <ActionButton variant="primary" onClick={startCreate}>
          <Plus size={12} className="inline mr-1" />New post
        </ActionButton>
      </Toolbar>

      <p className="mb-3 text-[11px] text-egypt-papyrus/50">{total} post(s)</p>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-widest text-egypt-papyrus/50 border-b border-white/10">
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 hidden md:table-cell">Published</th>
              <th className="px-3 py-2 hidden md:table-cell">Updated</th>
            </tr>
          </thead>
          <tbody>
            {posts.map(post => (
              <tr
                key={post.id}
                className="border-b border-white/5 hover:bg-white/5 cursor-pointer"
                onClick={() => void openEditor(post.id)}
              >
                <td className="px-3 py-2">
                  <p className="text-white">{post.title}</p>
                  <p className="text-[10px] font-mono text-egypt-papyrus/50">/blog/{post.slug}</p>
                </td>
                <td className="px-3 py-2"><StatusPill status={post.status} /></td>
                <td className="px-3 py-2 text-[11px] text-egypt-papyrus/50 hidden md:table-cell">
                  {post.published_at?.slice(0, 10) ?? '—'}
                </td>
                <td className="px-3 py-2 text-[11px] text-egypt-papyrus/50 hidden md:table-cell">
                  {post.updated_at?.slice(0, 16).replace('T', ' ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {posts.length === 0 && (
          <p className="px-4 py-6 text-sm text-egypt-papyrus/50">
            No posts match. Run <code>npm run cms:seed</code> if the CMS is empty.
          </p>
        )}
      </div>
    </div>
  );
}
