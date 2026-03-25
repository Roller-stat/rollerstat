import { PropsWithChildren, useEffect } from 'react';
import { AuthProvider } from './auth-context';
import { LocaleProvider } from './locale-context';
import { initTelemetry } from '../lib/telemetry';

export function AppProviders({ children }: PropsWithChildren) {
  useEffect(() => {
    initTelemetry();
  }, []);

  return (
    <LocaleProvider>
      <AuthProvider>{children}</AuthProvider>
    </LocaleProvider>
  );
}
