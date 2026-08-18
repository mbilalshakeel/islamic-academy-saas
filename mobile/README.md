# ICI Platform — Flutter Mobile App (White-Label, Multi-Tenant)

The mobile counterpart of the **ICI Multi-Tenant Web SaaS** (Islamic educational
platform). A **single Flutter codebase** that produces a uniquely-branded app for
every institute/client — own name, logo, splash, color theme, and app icon — built
from the **same source** with **no code duplication**.

Backend: the same production **Supabase** project as the web app. Tenant isolation
is enforced by **Supabase RLS** at the database level (same protection as web).

---

## 1. Project Structure

```
lib/
  main.dart                     # Entry point: init Hive → Supabase → Firebase → runApp
  app.dart                      # MaterialApp + Riverpod ProviderScope + dynamic ThemeData
  flavors/
    app_config.dart             # Build-time white-label constants (via --dart-define)
  models/
    tenant_branding.dart        # Mirrors tenant_branding (drives the theme)
    content_models.dart         # Quran, Qaida, Names, Duas, Hadith, Pillars, Prayers,
                                #   Books, Q&A, Contact, Dhikr, Calendar, SitePages, Menu
  services/
    supabase_service.dart       # Supabase client (anon key only; RLS isolation)
    content_service.dart        # Fetch all tenant content + cache-first reads
    cache_service.dart          # Hive local cache + user prefs (offline)
    theme_service.dart          # Builds ThemeData from live branding (WCAG contrast)
    notification_service.dart   # Firebase Cloud Messaging + local notifications
    sehri_iftar_service.dart    # Aladhan API for Sehri/Iftar times
  providers/
    providers.dart              # Riverpod: prefs, branding, theme, startup
  screens/
    splash_screen.dart          # Logo + name, loads live theme, then Home
    home_screen.dart            # Reading/Learning grids, books carousel, bottom nav
    quran/                      # Para list + PDF viewer (opens file link)
    qaida/                      # Course list + reader
    names/                      # Allah + Prophet names grid with details
    duas/                       # Daily Duas menu + detail modals
    hadith/                     # 40 Hadiths list
    pillars/                    # Tabbed pillars of Islam
    prayers/                    # Prayers list + details
    books/                      # Books list + open file
    qa/                         # Q&A accordion with category filter
    about/                      # Rich/block content
    contact/                    # Tap-to-call / whatsapp / email / map
    tools/                      # Sehri-Iftar, Dhikr Counter, Hijri Calendar, Zakat
    settings/                   # Language, font size, dark mode
  widgets/                      # (reusable UI — add as needed)
```

---

## 2. Setup

Prereqs: Flutter 3.x stable, Android Studio (Android SDK), Xcode (iOS, macOS only).

```bash
cd ici_platform_app
flutter pub get
flutter run --dart-define=TENANT_ID=... --dart-define=TENANT_SLUG=test-academy ...
```

Local `assets/images/logo_default.png` is a placeholder — replace per client.

---

## 3. White-Label Build System (the "15-minute per client" process)

Every brand-specific value is injected at **build time** via `--dart-define`
(see `lib/flavors/app_config.dart`). No secrets are compiled in — only the **public
Supabase anon key** (RLS keeps each tenant isolated).

### Per-client checklist — files/values to change

| Value | Where it lives | Notes |
|---|---|---|
| TENANT_ID | `--dart-define=TENANT_ID` | the tenant UUID in Supabase |
| TENANT_SLUG | `--dart-define=TENANT_SLUG` | e.g. `test-academy` |
| APP_NAME / APP_SHORT_NAME | `--dart-define=APP_NAME=...` | display name |
| PRIMARY_COLOR / SECONDARY_COLOR | `--dart-define=PRIMARY_COLOR=#...` | branding fallback (live theme overrides from DB) |
| LOGO_ASSET | `--dart-define=LOGO_ASSET=assets/images/logo_x.png` | per-client logo file |
| APP_PACKAGE / APP_BUNDLE | `--dart-define` + Android `applicationId` / iOS bundle id | unique per client |
| App icon + splash | `android/app/src/main/res/...` + iOS asset catalog | per-client icon/splash |
| google-services.json (Firebase) | `android/app/` + `ios/Runner/` | per-client or shared Firebase project |
| SUPABASE_URL / SUPABASE_ANON_KEY | `--dart-define` | same backend URL for all |

### Example build commands

```bash
# Client #1 (Test Academy)
flutter build apk \
  --dart-define=TENANT_ID=a94ddfee-879c-4367-ab79-f0d1b79160b5 \
  --dart-define=TENANT_SLUG=test-academy \
  --dart-define=APP_NAME="Test Academy" \
  --dart-define=APP_SHORT_NAME="TestAcademy" \
  --dart-define=PRIMARY_COLOR=#0284C7 \
  --dart-define=SECONDARY_COLOR=#0EA5E9 \
  --dart-define=LOGO_ASSET=assets/images/logo_test_academy.png \
  --dart-define=APP_PACKAGE=com.iciplatform.testacademy \
  --dart-define=APP_BUNDLE=com.iciplatform.testacademy

# iOS (macOS only)
flutter build ios --release --no-codesign \
  --dart-define=TENANT_ID=... --dart-define=TENANT_SLUG=... --dart-define=APP_NAME=...
```

### Repeatable process for new clients (build #2, #3, #4…)
1. Copy this app folder → new client folder.
2. Drop in the client's logo + app-icon + splash assets.
3. Set the `--dart-define` values (or a small build script per client).
4. Set the Android `applicationId` and iOS `PRODUCT_BUNDLE_IDENTIFIER`.
5. Add `google-services.json` (Firebase) for push.
6. `flutter build apk` / `flutter build ios`.

No Dart code changes are required between clients — it is pure configuration + assets.

---

## 4. Supabase + Firebase Connection

**Supabase:** `SUPABASE_URL` + `SUPABASE_ANON_KEY` (public anon key) injected via
`--dart-define`. All reads are filtered by the tenant injected at build time; RLS
enforces isolation.

**Firebase / FCM:** `NotificationService` initializes Firebase Messaging, requests
permission, and can show local notifications. Sender-side (institute admin sending
announcements) is **backend work** outside this Flutter build — when ready, the admin
publishes to FCM via the Supabase/Firebase Admin SDK and this app displays them.
Add each client's `google-services.json` / `GoogleService-Info.plist`.

---

## 5. Build & Deploy

- **Android:** `flutter build apk --release` (needs a keystore for release signing).
- **iOS:** `flutter build ios --release` (needs Apple signing + provisioning).
- **Signing:** environment-specific, must be managed securely per client (Android
  keystore, Apple Developer certificates).

### Release signing (Android)

`android/app/build.gradle` reads a `key.properties` file (gitignored) to sign the
release build. To generate your own keystore per client:

```bash
keytool -genkeypair -v -keystore android/app/upload-keystore.jks \
  -keyalg RSA -keysize 2048 -validity 10000 -alias upload \
  -storepass <your-pass> -keypass <your-pass> \
  -dname "CN=ClientName, OU=Dev, O=Org, L=City, ST=State, C=SA"
```

Then create `android/key.properties` (DO NOT commit):
```
storePassword=<your-pass>
keyPassword=<your-pass>
keyAlias=upload
storeFile=upload-keystore.jks
```

`flutter build apk --release` will now produce a signed `app-release.apk`.
Verify: `apksigner verify --print-certs build/app/outputs/flutter-apk/app-release.apk`

### Store submission notes (README section for reviewers)
- Prepare 6+ screenshots (phone/tablet), app description, and a link to your privacy
  policy (required for account/notification permissions).
- Review timeline: Google Play ~1–3 days, Apple App Store ~1–3 days (first submission
  longer).
- On rejection: read the reason, fix, resubmit. Common items: privacy policy link,
  notification permission rationale, accurate app category.

---

## 6. Offline / Caching

- All content + branding cached in **Hive** after first fetch (`CacheService`).
- On startup: load cache instantly, then background-check `sw_cache_version` and
  refresh if changed (`ContentService.checkForUpdates`).
- Dhikr counter persists per-tenant via Hive.
- User prefs (language, font size, dark mode) persisted in Hive.

## 7. Security

- Uses only the public **anon** key; no service-role key or secrets in the app.
- Tenant isolation via **RLS** at the database level (identical to web).
- No API keys or sensitive data in source code — everything build-time injected.
