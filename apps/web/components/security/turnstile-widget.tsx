'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          action?: string;
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
        },
      ) => string;
      remove?: (widgetId: string) => void;
    };
  }
}

type TurnstileWidgetProps = {
  action: string;
  onTokenChange: (token: string) => void;
};

const TURNSTILE_SCRIPT_SELECTOR = 'script[data-turnstile-script="true"]';
const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

function ensureTurnstileScript(onLoad: () => void) {
  const existingScript = document.querySelector<HTMLScriptElement>(TURNSTILE_SCRIPT_SELECTOR);
  if (existingScript) {
    if (window.turnstile) {
      onLoad();
      return;
    }

    existingScript.addEventListener('load', onLoad, { once: true });
    return;
  }

  const script = document.createElement('script');
  script.src = TURNSTILE_SCRIPT_URL;
  script.async = true;
  script.defer = true;
  script.dataset.turnstileScript = 'true';
  script.addEventListener('load', onLoad, { once: true });
  document.head.appendChild(script);
}

export function TurnstileWidget({ action, onTokenChange }: TurnstileWidgetProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    onTokenChange('');

    if (!siteKey || !containerRef.current) {
      return;
    }

    let isDisposed = false;

    const render = () => {
      if (isDisposed || !window.turnstile || !containerRef.current) {
        return;
      }

      if (widgetIdRef.current && window.turnstile.remove) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }

      containerRef.current.innerHTML = '';
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        action,
        callback: (token) => onTokenChange(token),
        'expired-callback': () => onTokenChange(''),
        'error-callback': () => onTokenChange(''),
      });
    };

    ensureTurnstileScript(render);

    return () => {
      isDisposed = true;
      if (widgetIdRef.current && window.turnstile?.remove) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [action, onTokenChange, siteKey]);

  if (!siteKey) {
    return null;
  }

  return <div className="mt-2 flex justify-center" ref={containerRef} />;
}
