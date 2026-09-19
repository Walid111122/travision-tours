import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Shared primitives for the admin dashboard — consistent labelling (every
 * input gets a real <label>), focus-ring styling, and a focus-trapping modal.
 * The visual language matches the public site (egypt-night / egypt-gold) but
 * the density is tuned for desk work rather than marketing pages.
 */

export const inputClass =
  'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-egypt-gold focus:ring-1 focus:ring-egypt-gold/50 disabled:opacity-50';

export const labelClass =
  'block text-[10px] uppercase font-black tracking-widest text-egypt-papyrus/60 mb-1';

export function Field(props: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  const id = React.useId();
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {props.label}
        {props.required && <span className="text-egypt-gold"> *</span>}
      </label>
      {React.cloneElement(props.children as React.ReactElement, { id })}
      {props.hint && <p className="mt-1 text-[11px] text-egypt-papyrus/40">{props.hint}</p>}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === 'published' || status === 'confirmed' || status === 'paid' || status === 'accepted'
      ? 'border-emerald-500/40 text-emerald-300'
      : status === 'draft'
        ? 'border-egypt-papyrus/30 text-egypt-papyrus/70'
        : status === 'archived' || status === 'cancelled' || status === 'declined' || status === 'expired'
          ? 'border-red-500/40 text-red-300'
          : 'border-egypt-gold/40 text-egypt-gold';
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${tone}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mb-4 flex items-start gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

export function Toolbar(props: { children: React.ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-center gap-2">{props.children}</div>;
}

export function ActionButton(props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger';
}) {
  const { variant = 'ghost', className = '', ...rest } = props;
  const base =
    'px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-egypt-gold/60';
  const tone =
    variant === 'primary'
      ? 'bg-egypt-gold text-egypt-night hover:bg-white'
      : variant === 'danger'
        ? 'border border-red-500/40 text-red-300 hover:bg-red-500/10'
        : 'border border-white/10 text-egypt-papyrus/80 hover:border-egypt-gold';
  return <button type="button" className={`${base} ${tone} ${className}`} {...rest} />;
}

export function SectionCard(props: {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-xs uppercase font-black tracking-widest text-egypt-papyrus/60">
          {props.title}
        </h2>
        {props.actions}
      </div>
      {props.children}
    </section>
  );
}

/**
 * Focus-trapping modal: Tab cycles inside, Escape closes, focus returns to
 * the opener. `aria-modal` announces it to screen readers.
 */
export function Modal(props: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const { onClose } = props;
  const ref = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<Element | null>(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement;
    const root = ref.current;
    root?.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !root) return;
      const focusable: HTMLElement[] = Array.from(
        root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      ).filter((el): el is HTMLElement => el instanceof HTMLElement && !el.hasAttribute('disabled'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      (previouslyFocused.current as HTMLElement | null)?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-egypt-night/80 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={props.title}
      onClick={event => {
        if (event.target === event.currentTarget) props.onClose();
      }}
    >
      <div
        ref={ref}
        className={`bg-egypt-night border border-white/15 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto ${props.wide ? 'w-full max-w-4xl' : 'w-full max-w-lg'}`}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-sm uppercase font-black tracking-widest text-egypt-gold">{props.title}</h2>
          <button
            type="button"
            onClick={props.onClose}
            aria-label="Close dialog"
            className="text-egypt-papyrus/60 hover:text-white focus:outline-none focus:ring-1 focus:ring-egypt-gold/60 rounded"
          >
            <X size={18} />
          </button>
        </div>
        {props.children}
      </div>
    </div>
  );
}

/** Live region for async status announcements. */
export function StatusAnnouncer({ message }: { message: string }) {
  return (
    <p aria-live="polite" className="sr-only">
      {message}
    </p>
  );
}
