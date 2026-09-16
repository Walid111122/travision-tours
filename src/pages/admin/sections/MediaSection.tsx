import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, Archive } from 'lucide-react';
import { adminFetch, adminUpload, type MediaAsset, type SessionInfo } from '../api';
import {
  ActionButton, ErrorBanner, Field, inputClass, SectionCard, StatusAnnouncer, StatusPill, Toolbar
} from '../components';

/**
 * Media library. Uploads are validated server-side by file signature —
 * the UI only sends the raw bytes plus alt text. Referenced assets cannot be
 * archived (the API returns usage), and there is no hard delete.
 */
export default function MediaSection({ session: _session }: { session: SessionInfo }) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('active');
  const [alt, setAlt] = useState('');
  const [error, setError] = useState('');
  const [announce, setAnnounce] = useState('');
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setError('');
    const params = new URLSearchParams({ limit: '100' });
    if (statusFilter) params.set('status', statusFilter);
    try {
      const result = await adminFetch<{ media: MediaAsset[]; total: number }>(`/media?${params}`);
      setAssets(result.media);
      setTotal(result.total);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load media.');
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const upload = async (file: File) => {
    if (!alt.trim()) {
      setError('Alt text is required before uploading.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await adminUpload(`/media?filename=${encodeURIComponent(file.name)}&alt=${encodeURIComponent(alt.trim())}`, file);
      setAnnounce(`Uploaded ${file.name}.`);
      setAlt('');
      if (fileInput.current) fileInput.current.value = '';
      void load();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  const archive = async (id: string) => {
    setBusy(true);
    setError('');
    try {
      await adminFetch(`/media/${encodeURIComponent(id)}/archive`, { method: 'POST' });
      setAnnounce('Asset archived.');
      void load();
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : 'Archive failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <StatusAnnouncer message={announce} />
      <ErrorBanner message={error} />

      <SectionCard title="Upload image">
        <div className="grid md:grid-cols-3 gap-3 items-end">
          <Field label="Image file" required hint="JPEG, PNG or WebP — signatures are verified, SVG and executables are refused.">
            <input
              ref={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className={inputClass}
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) void upload(file);
              }}
              disabled={busy || !alt.trim()}
            />
          </Field>
          <Field label="Alt text" required hint="Required — describes the image for screen readers.">
            <input className={inputClass} value={alt} onChange={e => setAlt(e.target.value)} placeholder="Describe the image" />
          </Field>
          <div className="text-[11px] text-egypt-papyrus/50 pb-2">
            <Upload size={14} className="inline mr-1" aria-hidden />
            Stored in the media bucket; referenced images cannot be archived.
          </div>
        </div>
      </SectionCard>

      <Toolbar>
        <select
          className={`${inputClass} w-auto`}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          aria-label="Filter media"
        >
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="">All</option>
        </select>
        <span className="text-[11px] text-egypt-papyrus/50">{total} asset(s)</span>
      </Toolbar>

      <ul className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {assets.map(asset => (
          <li key={asset.id} className="bg-white/5 border border-white/10 rounded-xl p-2">
            <img
              src={asset.url}
              alt={asset.alt}
              className="w-full h-24 object-cover rounded-lg bg-white/5"
              loading="lazy"
            />
            <p className="mt-1 text-[10px] text-white truncate" title={asset.filename}>{asset.filename}</p>
            <p className="text-[9px] text-egypt-papyrus/50">
              {asset.width}×{asset.height} · {Math.round(asset.size_bytes / 1024)} KB ·{' '}
              <StatusPill status={asset.status} />
            </p>
            <p className="text-[9px] text-egypt-papyrus/50 mt-1 line-clamp-2" title={asset.alt}>alt: {asset.alt}</p>
            {asset.status === 'active' && (
              <div className="mt-2">
                <ActionButton onClick={() => void archive(asset.id)} disabled={busy}>
                  <Archive size={11} className="inline mr-1" />Archive
                </ActionButton>
              </div>
            )}
          </li>
        ))}
      </ul>
      {assets.length === 0 && (
        <p className="text-sm text-egypt-papyrus/60">
          No media assets. Existing site images under <code>/images/…</code> remain usable directly
          in image fields; uploaded assets appear here.
        </p>
      )}
    </div>
  );
}
