import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard, Map, FileText, Inbox, FileSignature, Image, History,
  ScrollText, Settings, LogOut, AlertTriangle, Menu, X
} from 'lucide-react';
import type { SessionInfo } from './api';
import DashboardSection from './sections/DashboardSection';
import ToursSection from './sections/ToursSection';
import BlogSection from './sections/BlogSection';
import InquiriesSection from './sections/InquiriesSection';
import QuotationsSection from './sections/QuotationsSection';
import MediaSection from './sections/MediaSection';
import RevisionsSection from './sections/RevisionsSection';
import AuditSection from './sections/AuditSection';
import SettingsSection from './sections/SettingsSection';

/**
 * The administration dashboard shell.
 *
 * Sections are switched client-side via the location hash (`/admin#tours`)
 * so the public site only ever ships one /admin document — no extra routes,
 * nothing for crawlers to see, and the prerendered HTML carries no data.
 * The real boundary is server-side: every /api/admin/* call requires a
 * verified Cloudflare Access identity.
 */

const SECTIONS = [
  { key: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { key: 'tours', label: 'Tours & trips', icon: Map },
  { key: 'blog', label: 'Blog', icon: FileText },
  { key: 'inquiries', label: 'Inquiries', icon: Inbox },
  { key: 'quotations', label: 'Quotations', icon: FileSignature },
  { key: 'media', label: 'Media', icon: Image },
  { key: 'revisions', label: 'Revisions', icon: History },
  { key: 'audit', label: 'Audit log', icon: ScrollText },
  { key: 'settings', label: 'Settings', icon: Settings }
] as const;

type SectionKey = (typeof SECTIONS)[number]['key'];

function sectionFromHash(): SectionKey {
  const key = window.location.hash.replace(/^#\/?/, '');
  return (SECTIONS as readonly { key: string }[]).some(s => s.key === key)
    ? (key as SectionKey)
    : 'dashboard';
}

export default function AdminApp({ session }: { session: SessionInfo }) {
  const [section, setSection] = useState<SectionKey>(sectionFromHash);
  const [navOpen, setNavOpen] = useState(false);
  const [narrowViewport, setNarrowViewport] = useState(false);
  const [dismissedViewportWarning, setDismissedViewportWarning] = useState(false);

  useEffect(() => {
    const onHash = () => setSection(sectionFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 768px)');
    const update = () => setNarrowViewport(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const navigate = (key: SectionKey) => {
    window.location.hash = key === 'dashboard' ? '' : key;
    setSection(key);
    setNavOpen(false);
  };

  const signOut = () => {
    // On an Access-protected deployment this path is intercepted by
    // Cloudflare Access and clears the session cookie. In the local dev
    // bypass there is no session to clear — the banner explains that.
    window.location.href = '/cdn-cgi/access/logout';
  };

  const Active = {
    dashboard: DashboardSection,
    tours: ToursSection,
    blog: BlogSection,
    inquiries: InquiriesSection,
    quotations: QuotationsSection,
    media: MediaSection,
    revisions: RevisionsSection,
    audit: AuditSection,
    settings: SettingsSection
  }[section];

  return (
    <div className="min-h-screen bg-egypt-night text-egypt-papyrus flex">
      {/* Sidebar — desktop / slide-over drawer on small screens */}
      <nav
        aria-label="Administration sections"
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-egypt-night border-r border-white/10 flex flex-col transform transition-transform md:static md:translate-x-0 ${navOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-black tracking-widest text-egypt-gold">Travision Tours</p>
            <p className="text-sm font-serif uppercase">Administration</p>
          </div>
          <button
            type="button"
            className="md:hidden text-egypt-papyrus/60"
            onClick={() => setNavOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto py-3">
          {SECTIONS.map(({ key, label, icon: Icon }) => (
            <li key={key}>
              <button
                type="button"
                onClick={() => navigate(key)}
                aria-current={section === key ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-inset focus:ring-egypt-gold/60 ${
                  section === key
                    ? 'bg-egypt-gold/15 text-egypt-gold border-r-2 border-egypt-gold'
                    : 'text-egypt-papyrus/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={16} aria-hidden />
                {label}
              </button>
            </li>
          ))}
        </ul>
        <div className="p-4 border-t border-white/10">
          <p className="text-[11px] text-egypt-papyrus/50 truncate" title={session.email}>
            {session.email}
          </p>
          <button
            type="button"
            onClick={signOut}
            className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-egypt-papyrus/70 hover:border-egypt-gold hover:text-white focus:outline-none focus:ring-1 focus:ring-egypt-gold/60"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </nav>

      {navOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setNavOpen(false)}
          aria-hidden
        />
      )}

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-egypt-night/95 backdrop-blur border-b border-white/10 px-4 md:px-8 py-3 flex items-center gap-3">
          <button
            type="button"
            className="md:hidden text-egypt-papyrus/70"
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-sm uppercase font-black tracking-widest text-white">
            {SECTIONS.find(s => s.key === section)?.label}
          </h1>
        </header>

        {session.devBypass && (
          <div
            role="status"
            className="bg-amber-500/15 border-b border-amber-500/40 px-4 md:px-8 py-2 text-[11px] uppercase font-black tracking-widest text-amber-300 flex items-center gap-2"
          >
            <AlertTriangle size={14} aria-hidden />
            Local development auth bypass — Cloudflare Access is not verifying this session.
          </div>
        )}

        {narrowViewport && !dismissedViewportWarning && (
          <div role="status" className="bg-white/5 border-b border-white/10 px-4 md:px-8 py-2 text-[11px] text-egypt-papyrus/70 flex items-center justify-between gap-3">
            <span>
              Narrow viewport — quick edits are fine, but destructive or large
              editing workflows are safer on a desktop or tablet.
            </span>
            <button
              type="button"
              className="text-egypt-gold text-[10px] uppercase font-black tracking-widest"
              onClick={() => setDismissedViewportWarning(true)}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Not a <main> — AppShell already provides the page's main landmark. */}
        <div className="flex-1 px-4 md:px-8 py-6 max-w-7xl w-full mx-auto">
          <Active session={session} />
        </div>
      </div>
    </div>
  );
}
