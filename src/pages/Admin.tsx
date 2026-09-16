import React, { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import SEO from '../components/SEO';
import AdminApp from './admin/AdminApp';
import { adminFetch, type SessionInfo } from './admin/api';

/**
 * Operator gateway.
 *
 * This page holds no data of its own: everything the dashboard shows comes
 * from `/api/admin/*`, which requires a verified Cloudflare Access identity.
 * The prerendered document is a static "checking access" shell with noindex —
 * an unauthorised visitor sees no data because the API refuses them.
 */

const ADMIN_DESCRIPTION =
  'Private administration for Travision Tours. Access requires an approved Cloudflare Access account.';

const Admin = () => {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    adminFetch<SessionInfo>('/session')
      .then(setSession)
      .catch(() => setDenied(true));

    const onUnauthorized = () => setDenied(true);
    window.addEventListener('admin:unauthorized', onUnauthorized);
    return () => window.removeEventListener('admin:unauthorized', onUnauthorized);
  }, []);

  if (denied) {
    return (
      <div className="pt-32 pb-20 px-6 max-w-3xl mx-auto text-center">
        <SEO title="Operator access" description={ADMIN_DESCRIPTION} canonical="/admin" noIndex />
        <Lock className="mx-auto mb-6 text-egypt-gold" size={40} />
        <h1 className="text-3xl font-serif uppercase mb-4">Operator access required</h1>
        <p className="text-egypt-papyrus/60 font-light leading-relaxed">
          This area is protected by Cloudflare Access. Sign in with an approved operator account to
          continue — the dashboard is never reachable anonymously.
        </p>
      </div>
    );
  }

  if (!session) {
    // This is the branch the prerenderer captures, so it has to carry the
    // document's title, description and robots tag as well as a real heading.
    return (
      <div className="pt-32 pb-20 px-6 max-w-3xl mx-auto text-center text-egypt-papyrus/60">
        <SEO title="Operator access" description={ADMIN_DESCRIPTION} canonical="/admin" noIndex />
        <h1 className="text-3xl font-serif uppercase mb-4 text-egypt-papyrus">Operator access</h1>
        <p className="font-light leading-relaxed">Checking operator access…</p>
      </div>
    );
  }

  return <AdminApp session={session} />;
};

export default Admin;
