# Waimea - Resume Guide

Last updated: 2026-08-05. Working notes for picking this project back up.

## What Waimea is

Alarm app where every alarm carries a **pinned timezone** (`time + IANA zone + recurrence`), so it rings at the correct local wall-clock time wherever you are. Weather-app-style location cards; tap a card for its iOS-Clock-style alarm list.

- **Ownership:** each alarm belongs to ONE location (`locationId`) and shows ONLY on that card. But every enabled alarm still rings globally at its pinned instant (SF alarms fire while you're in Hawaii; you just manage them under the SF card).
- **Locations:** named "City, State, Country", searchable by IATA airport code (SFO/OAK/HNL) via `codes` in `src/lib/zones.ts`.

## Status

| Milestone | State |
|---|---|
| M1 - Web app | **Built + verified end-to-end** (live browser walkthrough, zero console errors) |
| M2 - MRR (Firebase Auth + Stripe freemium) | TODO |
| M3 - Native (iOS + Android) | **In progress** - see below |

## Run the web app

```bash
cd ~/LocalDocuments/Development/waimea
npx expo start --web      # serves on http://localhost:8081
```
Tests: `bun run test` (Jest 29). Typecheck: `bunx tsc --noEmit`.

## Next action: finish the Android build

The Gradle build got through config + NDK install, then failed because a dependency needs `build-tools;35.0.0` (its auto-install was interrupted). One-line fix, then rebuild:

```bash
export ANDROID_HOME=~/Library/Android/sdk
sdkmanager "build-tools;35.0.0"
cd ~/LocalDocuments/Development/waimea
npx expo run:android
# or, for streaming logs:  cd android && ./gradlew :app:assembleDebug --console=plain
```
Notes: only AVD is `AndroidTV_API34_1080p` (a TV image - works, but a phone AVD would be better). New Arch on; compileSdk/targetSdk 36; NDK 27.1; Gradle 9.3.1.

## iOS: blocked on a user download

Xcode 26.6 only ships the **iOS 26.5** simulator SDK, but the only installed sim runtime is iOS 17.5 (a leftover Xcode 26 will not build to). Download the current runtime:
```bash
xcodebuild -downloadPlatform iOS      # ~7 GB; also unblocks AlarmKit (iOS 26+)
```
Then `npx expo run:ios`. The native project + pods are already generated. Node pinned for Xcode via `ios/.xcode.env.local` (uses nvm node v24, since `/usr/local/bin/node` is v18).

## Real alarms (after it runs natively)

Scheduler seam is ready: `src/lib/alarm.ts` (interface), `src/lib/scheduler.ts` (native no-op base), `src/lib/scheduler.web.ts` (soft notifications). Drop in:
- `src/lib/scheduler.android.ts` -> Android `AlarmManager` (testable on emulator now)
- `src/lib/scheduler.ios.ts` -> iOS `AlarmKit` via `react-native-nitro-ios-alarm-kit` (iOS 26+)

## Key files

- `App.tsx` - root, TamaguiProvider + theme, simple route state
- `src/store.ts` - Zustand + persist; seeds SF workday; `themePref`, locations, alarms
- `src/lib/schedule.ts` - timezone engine (Luxon), fully unit-tested
- `src/screens/LocationsScreen.tsx`, `src/screens/LocationDetailScreen.tsx`
- `src/components/` - AlarmEditor, AddLocationModal, AppSwitch (custom), ThemeToggle, StatusChip

## Gotchas (learned the hard way)

- **Tamagui v5 shorthands changed:** use `items justify rounded text self shrink`; the old `ai jc br ta alignSelf flexShrink` are gone (fail at runtime + typecheck). `Card` has no `bordered` (use borderWidth/borderColor). `ScrollView` rejects `contentContainerStyle` padding - wrap in a padded `YStack`.
- **No animation driver** in the default config -> built-in `Switch` thumb won't move; we use a custom `AppSwitch`.
- **Large text needs explicit `lineHeight`** or it overlaps the element below.
- Jest must be v29 (jest-expo 57 needs 29, not 30).

Full plan: `~/.claude/plans/merry-coalescing-heron.md`.
