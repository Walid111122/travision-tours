import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import type { SessionInfo } from '../api';
import { SectionCard } from '../components';
import { DISPLAY_CURRENCY, INQUIRY_POLICY_VERSION, PAYMENT_PARTNER_NAME, SITE_NAME } from '../../../config/business';

/**
 * Settings & readiness — an at-a-glance view of what is wired, what is
 * deferred to the domain phase, and the operational constants the Worker is
 * enforcing. Nothing here mutates configuration; it is a read-only checklist.
 */
const READY = [
  'CMS schema migrated locally (migration 0008)',
  'Inquiry → quotation → confirmation workflow implemented',
  'Quotation & policy print-ready document renderer',
  'Cloudflare Access JWT verification in the Worker',
  'Append-only audit log and revision history',
  'Media library with signature validation',
  'Deterministic cms:seed / cms:export / cms:diff tooling'
];

const DEFERRED = [
  'Register/configure the domain and DNS',
  'Create the production D1 database and apply remote migrations',
  'Create the production R2 bucket and keep the MEDIA binding',
  'Create the Cloudflare Access application and set ACCESS_TEAM_DOMAIN / ACCESS_AUD / ACCESS_ALLOWED_EMAILS secrets',
  'Provision the mailbox, then flip EMAIL_PUBLISHED',
  'Set production secrets (Turnstile, notification webhook, RATE_LIMIT_SALT)',
  'Build with SITE_URL=<domain> and run npm run build:production && npm run verify',
  'Deploy with wrangler deploy, then run a controlled production inquiry',
  'Move CSP from report-only to enforcing after review'
];

export default function SettingsSection({ session }: { session: SessionInfo }) {
  return (
    <div>
      <SectionCard title="Runtime">
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {([
            ['Site', SITE_NAME],
            ['Payment partner', PAYMENT_PARTNER_NAME],
            ['Environment', session.environment],
            ['Signed in as', session.email],
            ['Dev auth bypass', session.devBypass ? 'ACTIVE — local only' : 'off'],
            ['Inquiry policy version', INQUIRY_POLICY_VERSION],
            ['Display / quotation currency', DISPLAY_CURRENCY]
          ] as [string, string][]).map(([label, value]) => (
            <div key={label}>
              <dt className="text-egypt-papyrus/50 uppercase tracking-widest text-[9px]">{label}</dt>
              <dd className="text-white">{value}</dd>
            </div>
          ))}
        </dl>
      </SectionCard>

      <SectionCard title="Ready">
        <ul className="space-y-2 text-xs">
          {READY.map(item => (
            <li key={item} className="flex items-start gap-2 text-egypt-papyrus/80">
              <CheckCircle size={14} className="text-emerald-400 mt-0.5 shrink-0" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Deferred to the domain phase">
        <ul className="space-y-2 text-xs">
          {DEFERRED.map(item => (
            <li key={item} className="flex items-start gap-2 text-egypt-papyrus/80">
              <Circle size={14} className="text-egypt-gold mt-0.5 shrink-0" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[11px] text-egypt-papyrus/50">
          Details: ADMIN_DASHBOARD_GUIDE.md and LAUNCH_CHECKLIST.md.
        </p>
      </SectionCard>
    </div>
  );
}
