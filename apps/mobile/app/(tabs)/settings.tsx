import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import { useAuth } from '../../src/context/auth-context';
import { useLocale } from '../../src/context/locale-context';
import { APP_LOCALES } from '../../src/lib/constants';
import { ACCOUNT_DELETE_WEB_URL, API_BASE_URL } from '../../src/lib/config';

export default function SettingsScreen() {
  const { locale, setLocale } = useLocale();
  const { user, loading, signInWithGoogleIdToken, signOut, deleteAccount } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  const googleClientIds = useMemo(
    () => ({
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    }),
    [],
  );

  const googleConfigured = Boolean(
    googleClientIds.androidClientId || googleClientIds.webClientId || googleClientIds.expoClientId,
  );

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: googleClientIds.androidClientId,
    webClientId: googleClientIds.webClientId,
    clientId: googleClientIds.expoClientId || googleClientIds.webClientId,
    scopes: ['profile', 'email'],
  });

  useEffect(() => {
    if (!response) {
      return;
    }

    if (response.type !== 'success') {
      setSigningIn(false);
      return;
    }

    const idToken = response.params?.id_token || response.authentication?.idToken;
    if (!idToken) {
      Alert.alert('Sign-in failed', 'Google did not return an ID token.');
      setSigningIn(false);
      return;
    }

    setSigningIn(true);
    signInWithGoogleIdToken(idToken)
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Sign-in failed.';
        Alert.alert('Sign-in failed', message);
      })
      .finally(() => {
        setSigningIn(false);
      });
  }, [response, signInWithGoogleIdToken]);

  async function handleGoogleSignIn() {
    if (!googleConfigured) {
      Alert.alert(
        'Google sign-in not configured',
        'Set EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID and EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID first.',
      );
      return;
    }

    try {
      setSigningIn(true);
      await promptAsync();
    } catch {
      Alert.alert('Sign-in failed', 'Unable to open Google sign-in right now.');
      setSigningIn(false);
    }
  }

  async function handleDeleteAccount() {
    Alert.alert(
      'Delete account?',
      'This removes your RollerStat account profile and associated comments.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              Alert.alert('Account deleted', 'Your deletion request has been processed.');
            } catch {
              Alert.alert('Failed', 'Unable to delete account right now.');
            }
          },
        },
      ],
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Language</Text>
        <View style={styles.localeWrap}>
          {APP_LOCALES.map((item) => {
            const active = locale === item;
            return (
              <Pressable
                key={item}
                onPress={() => setLocale(item)}
                style={[styles.localeButton, active ? styles.localeButtonActive : null]}
              >
                <Text style={[styles.localeButtonText, active ? styles.localeButtonTextActive : null]}>
                  {item.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        {loading ? (
          <ActivityIndicator color="#111827" />
        ) : user ? (
          <View style={styles.accountCard}>
            <Text style={styles.accountName}>{user.name || 'Signed in user'}</Text>
            <Text style={styles.accountEmail}>{user.email || 'No email provided'}</Text>

            <Pressable style={styles.actionButton} onPress={signOut}>
              <Text style={styles.actionButtonText}>Sign out</Text>
            </Pressable>

            <Pressable style={styles.deleteButton} onPress={handleDeleteAccount}>
              <Text style={styles.deleteButtonText}>Delete account in-app</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.accountCard}>
            <Text style={styles.accountHint}>Sign in with Google to comment and sync your profile.</Text>
            <Pressable
              style={[styles.actionButton, (!request || signingIn) ? styles.disabledButton : null]}
              onPress={handleGoogleSignIn}
              disabled={!request || signingIn}
            >
              <Text style={styles.actionButtonText}>
                {signingIn ? 'Signing in...' : 'Sign in with Google'}
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Compliance</Text>
        <Pressable
          style={styles.outlineButton}
          onPress={() => {
            Linking.openURL(ACCOUNT_DELETE_WEB_URL).catch(() => {
              Alert.alert('Unable to open URL', ACCOUNT_DELETE_WEB_URL);
            });
          }}
        >
          <Text style={styles.outlineButtonText}>Open account deletion web page</Text>
        </Pressable>

        <Text style={styles.metaText}>API base URL: {API_BASE_URL}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 48,
    backgroundColor: '#f8fafc',
    gap: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  section: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    padding: 14,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  localeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  localeButton: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  localeButtonActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  localeButtonText: {
    color: '#0f172a',
    fontWeight: '700',
  },
  localeButtonTextActive: {
    color: '#fff',
  },
  accountCard: {
    gap: 10,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  accountEmail: {
    color: '#475569',
  },
  accountHint: {
    color: '#475569',
  },
  actionButton: {
    backgroundColor: '#111827',
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#b91c1c',
    paddingVertical: 10,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#b91c1c',
    fontWeight: '700',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 10,
    alignItems: 'center',
  },
  outlineButtonText: {
    color: '#0f172a',
    fontWeight: '700',
  },
  metaText: {
    color: '#64748b',
    fontSize: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
