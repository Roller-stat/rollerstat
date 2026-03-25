import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'RollerStat',
  slug: 'rollerstat-mobile',
  scheme: 'rollerstat',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0b1220',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.rollerstat.app',
  },
  android: {
    package: 'com.rollerstat.app',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0b1220',
    },
  },
  plugins: ['expo-router', 'expo-secure-store', 'expo-web-browser', 'expo-asset'],
  experiments: {
    typedRoutes: true,
  },
};

export default config;
