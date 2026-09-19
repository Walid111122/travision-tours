import React, { useEffect, useState } from 'react';
import { adminFetch, type MediaAsset } from '../api';
import { ErrorBanner, Modal } from '../components';

/** Media picker used by image fields across the editors. */
export default function MediaPickerModal(props: {
  onPick: (asset: MediaAsset) => void;
  onClose: () => void;
}) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    adminFetch<{ media: MediaAsset[] }>('/media?status=active&limit=100')
      .then(result => setAssets(result.media))
      .catch(loadError => setError(loadError instanceof Error ? loadError.message : 'Could not load media.'));
  }, []);

  return (
    <Modal title="Choose media" onClose={props.onClose} wide>
      <ErrorBanner message={error} />
      {assets.length === 0 ? (
        <p className="text-sm text-egypt-papyrus/60">
          No uploaded media yet. Use the Media section to upload, or paste an
          existing <code>/images/…</code> path into the field directly.
        </p>
      ) : (
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {assets.map(asset => (
            <li key={asset.id}>
              <button
                type="button"
                onClick={() => props.onPick(asset)}
                className="w-full text-left border border-white/10 rounded-xl p-2 hover:border-egypt-gold focus:outline-none focus:ring-1 focus:ring-egypt-gold/60"
              >
                <img
                  src={asset.url}
                  alt={asset.alt}
                  className="w-full h-20 object-cover rounded-lg bg-white/5"
                  loading="lazy"
                />
                <p className="mt-1 text-[10px] text-egypt-papyrus/70 truncate">{asset.filename}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
