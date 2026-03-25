import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_LOCALE } from '../lib/constants';
import { getItem, setItem } from '../lib/storage';
import { AppLocale } from '../types/content';

const LOCALE_STORAGE_KEY = 'rs_mobile_locale';

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (next: AppLocale) => Promise<void>;
  ready: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<AppLocale>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      const stored = await getItem<AppLocale>(LOCALE_STORAGE_KEY);
      if (!active) {
        return;
      }
      if (stored) {
        setLocaleState(stored);
      }
      setReady(true);
    })();

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    ready,
    setLocale: async (next) => {
      setLocaleState(next);
      await setItem(LOCALE_STORAGE_KEY, next);
    },
  }), [locale, ready]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used inside LocaleProvider.');
  }

  return context;
}
