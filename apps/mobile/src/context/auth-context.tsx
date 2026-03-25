import { Alert } from 'react-native';
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import {
  deleteMobileAccount,
  getMobileSession,
  mobileLogout,
  signInWithGoogle,
} from '../lib/api';
import { MobileUser } from '../types/content';

const TOKEN_STORAGE_KEY = 'rs_mobile_auth_token';

type AuthContextValue = {
  token: string | null;
  user: MobileUser | null;
  loading: boolean;
  signInWithGoogleIdToken: (idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function readToken() {
  return SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
}

async function writeToken(token: string | null) {
  if (!token) {
    await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<MobileUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const storedToken = await readToken();
    if (!storedToken) {
      setToken(null);
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const session = await getMobileSession(storedToken);
      if (!session.authenticated) {
        await writeToken(null);
        setToken(null);
        setUser(null);
      } else {
        setToken(storedToken);
        setUser(session.user);
      }
    } catch {
      await writeToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession().catch(() => {
      setLoading(false);
    });
  }, [refreshSession]);

  const signInWithGoogleIdToken = useCallback(async (idToken: string) => {
    setLoading(true);
    try {
      const result = await signInWithGoogle(idToken);
      await writeToken(result.token);
      setToken(result.token);
      setUser(result.user);
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      const current = await readToken();
      if (current) {
        await mobileLogout(current).catch(() => null);
      }
      await writeToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    const current = await readToken();
    if (!current) {
      Alert.alert('Not signed in', 'Sign in first to delete your account.');
      return;
    }

    setLoading(true);
    try {
      await deleteMobileAccount(current);
      await writeToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      loading,
      signInWithGoogleIdToken,
      signOut,
      refreshSession,
      deleteAccount,
    }),
    [deleteAccount, loading, refreshSession, signInWithGoogleIdToken, signOut, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
