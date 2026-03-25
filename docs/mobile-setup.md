# RollerStat Mobile Setup (Android-first)

This project now includes `apps/mobile` (Expo + React Native) for the public RollerStat app.

## Current implementation

- Public content feed (Home, News, Blogs)
- Post detail pages
- Reactions and comments via existing `apps/web` APIs
- Google sign-in flow wired for mobile token exchange
- In-app account deletion endpoint
- Public account deletion web URL: `/en/account/delete`
- Basic read cache for content lists/details when network is unavailable

## 1) Local run (backend + mobile)

1. Start web API backend:

```bash
npm install
npm run dev:web
```

2. Start mobile app in another terminal:

```bash
cd apps/mobile
npm install
npm run android
```

## 2) Mobile environment variables

Create `apps/mobile/.env`:

```bash
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=
```

Notes:
- Android emulator uses `10.0.2.2` for local host machine.
- Physical device should use your machine LAN IP, e.g. `http://192.168.1.100:3000`.

## 3) Web backend environment (mobile auth)

Add these env vars to your web deployment/runtime (`apps/web` process env):

```bash
MOBILE_AUTH_SECRET=your-long-random-secret
MOBILE_GOOGLE_ANDROID_CLIENT_ID=...
MOBILE_GOOGLE_WEB_CLIENT_ID=...
# optional comma-separated allowlist:
MOBILE_GOOGLE_CLIENT_IDS=...
```

`MOBILE_AUTH_SECRET` signs mobile bearer tokens.

## 4) Google OAuth setup (required for sign-in)

1. In Google Cloud Console, create OAuth client IDs:
- Android client (`com.rollerstat.app` + SHA-1 fingerprints)
- Web client

2. Put values in:
- mobile `.env` (`EXPO_PUBLIC_GOOGLE_*`)
- backend env (`MOBILE_GOOGLE_*`)

3. Ensure the Android OAuth client package is exactly:
- `com.rollerstat.app`

## 5) Firebase setup (Crashlytics + minimal Analytics)

1. Create Firebase project and Android app with package:
- `com.rollerstat.app`

2. Download `google-services.json` and place in:
- `apps/mobile/google-services.json`

3. Enable:
- Crashlytics
- Google Analytics (minimal)

4. Add Firebase SDK packages when ready and initialize in `apps/mobile/src/lib/telemetry.ts`.

## 6) Google Play compliance paths

- In-app deletion: mobile Settings -> "Delete account in-app"
- Web deletion URL: `https://rollerstat.com/en/account/delete`
