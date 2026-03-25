import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { AppProviders } from '../src/context/app-providers';

WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="post/[type]/[slug]" options={{ title: 'Article' }} />
      </Stack>
    </AppProviders>
  );
}
