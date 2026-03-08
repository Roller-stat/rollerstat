'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface WebSessionProviderProps {
  children: ReactNode;
}

export function WebSessionProvider({ children }: WebSessionProviderProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
