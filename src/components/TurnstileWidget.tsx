import { useCallback, useEffect, useRef } from 'react';

/**
 * Cloudflare Turnstile is the primary abuse defence for the inquiry forms.
 *
 * The site key is public by design — it is rendered into the page. When it is
 * absent (local development, or before the owner supplies a key) the widget
 * renders nothing and the Worker's documented development bypass handles
 * verification instead.
 */
const SITE_KEY = String(import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '').trim();

const SCRIPT_ID = 'cf-turnstile-script';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export const isTurnstileEnabled = Boolean(SITE_KEY);

type TurnstileWidgetProps = {
  onToken: (token: string) => void;
  /** Increment to reset the widget after a successful submission. */
  resetSignal?: number;
  className?: string;
};

export default function TurnstileWidget({
  onToken,
  resetSignal = 0,
  className
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  const renderWidget = useCallback(() => {
    const container = containerRef.current;
    const api = window.turnstile;
    if (!container || !api || widgetIdRef.current) return;

    widgetIdRef.current = api.render(container, {
      sitekey: SITE_KEY,
      callback: (token: string) => onTokenRef.current(token),
      'expired-callback': () => onTokenRef.current(''),
      'error-callback': () => onTokenRef.current('')
    });
  }, []);

  useEffect(() => {
    if (!SITE_KEY) return;

    if (window.turnstile) {
      renderWidget();
      return;
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', renderWidget);
      return () => existing.removeEventListener('load', renderWidget);
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = renderWidget;
    document.head.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [renderWidget]);

  useEffect(() => {
    if (!SITE_KEY || !resetSignal) return;
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      onTokenRef.current('');
    }
  }, [resetSignal]);

  useEffect(() => {
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);

  if (!SITE_KEY) return null;
  return <div ref={containerRef} className={className} />;
}
