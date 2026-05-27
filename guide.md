# SyncStay — Build & Run Guide

## Desktop (Electron)

### Run in dev
```cmd
cd desktop
npm install
npm run dev
```
Opens the Electron window + starts the API server on port 8080.

### Build

| Output | Command | Result |
|--------|---------|--------|
| NSIS Installer | `npm run build:win` | `dist/SyncStay-Setup-1.0.0.exe` — installs app + creates shortcut |
| Portable EXE | add `- target: portable` to `electron-builder.yml` win targets, then `npm run build:win` | `dist/SyncStay-1.0.0.exe` — no install needed, run directly |
| Unpacked dir | `npm run build:unpack` | `dist/win-unpacked/` — folder you can zip and share |

---

## Mobile (Expo / React Native)

### Run in dev (browser)
```cmd
cd mobile
npm install
npx expo start --clear
```
Open `http://localhost:8081` in browser, or scan the QR with Expo Go on your phone.

---

### Build Android APK

#### Option A — Local Gradle build *(fastest, no account needed)*
```cmd
cd mobile
npx expo prebuild --platform android   # only needed first time or after app.json changes
cd android
gradlew assembleRelease
```
APK → `mobile\android\app\build\outputs\apk\release\app-release.apk`

> **Gradle version:** must be 8.13. Set in `android/gradle/wrapper/gradle-wrapper.properties`.

#### Option B — EAS cloud build *(needs Expo account)*
```cmd
cd mobile
npx eas build --platform android --profile preview
```
Download link printed when done. No local Android SDK needed.

#### Option C — EAS local build *(local SDK + EAS tooling)*
```cmd
cd mobile
npx eas build --platform android --profile preview --local
```

---

### Sideload APK onto phone
1. Transfer `app-release.apk` to phone (USB / Drive / WhatsApp)
2. Phone → **Settings → Install unknown apps** → allow your file manager
3. Tap the APK file → Install

---

## Prerequisites

| Tool | Min version | Check |
|------|-------------|-------|
| Node.js | 18+ | `node -v` |
| Java JDK | 17 | `java -version` |
| Android SDK | API 24+ | `echo %ANDROID_HOME%` |
| Gradle | 8.13 | auto-downloaded by wrapper |

> Java + Android SDK only needed for local Gradle builds (Option A / C).
> EAS cloud builds (Option B) have no local prerequisites beyond Node.
