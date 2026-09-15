import React, { useCallback, useEffect, useRef } from 'react';
import { motion } from 'motion/react';

/**
 * Elements that can receive keyboard focus inside a dialog. Disabled controls
 * and the `type="hidden"` / `display: none` honeypot fields are excluded.
 */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

/** `display: none` (and therefore the honeypot) yields no client rects. */
const isVisible = (element: HTMLElement) => element.getClientRects().length > 0;

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * `id` of the visible heading that names this dialog. The heading is rendered
   * by the caller so it keeps its styling; the dialog only references it.
   */
  titleId: string;
  className?: string;
  backdropClassName?: string;
  children: React.ReactNode;
}

/**
 * An accessible modal dialog.
 *
 * Provides the six things the plan requires of a dialog — `role="dialog"`,
 * `aria-modal`, a descriptive title association, initial focus, a focus trap,
 * Escape to close and focus restored to the trigger — in one place, so the
 * planner's share and request dialogs cannot drift apart.
 *
 * Animation is left to `motion` and is suppressed for reduced-motion visitors
 * by the app-level `<MotionConfig reducedMotion="user">`.
 */
export default function Modal({
  open,
  onClose,
  titleId,
  className = '',
  backdropClassName = '',
  children
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  /** Whatever had focus before opening, so it can be given back on close. */
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    restoreRef.current = document.activeElement as HTMLElement | null;

    // Initial focus: the first real control in the dialog. Both dialogs open
    // with a primary action, so this is predictable and immediately useful.
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (first ?? panel)?.focus();

    return () => {
      restoreRef.current?.focus?.();
    };
  }, [open]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable: HTMLElement[] = [];
      panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR).forEach(element => {
        if (isVisible(element)) focusable.push(element);
      });

      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      // Focus can end up outside the panel — for example when the focused
      // control is unmounted, as happens when the request form is replaced by
      // its success message. Pull it back rather than letting Tab escape.
      if (!panel.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-6 bg-egypt-night/95 backdrop-blur-xl ${backdropClassName}`}
      onKeyDown={handleKeyDown}
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={className}
      >
        {children}
      </motion.div>
    </div>
  );
}
