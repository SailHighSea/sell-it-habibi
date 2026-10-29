# Plan: move Sell It Habibi from Expo (React Native) to Flutter

Status: **proposal, not started.** Nothing here changes the current app. The decision gate is a one-session prototype (phase F0); only if you like it on your phone do we go on.

## 1. Why, and what we give up

**Why move**
- **Glass and gradients look as good as in your Family Expenses app.** Flutter draws every pixel itself (smooth blurred patches, dithering, real blur). In React Native we use the phone's own views and get banding, weaker blur and Android-only blur quirks.
- **Smoother on low-end phones.** Compiled code, no JavaScript engine, no bridge. Faster cold start.
- **Smaller APK.** About 15 to 25 MB per phone type, against about 45 MB now.
- **One look on every phone**, and you already have the theme, glass, appearance and adaptive-layout code in Dart.

**What we give up or have to work around**
- **Everything above the database is rewritten** (about 8,400 lines of TypeScript, 16 screens, 40 components). The backend is not.
- **Web:** Flutter web is one large canvas app; search engines and WhatsApp/Telegram link previews cannot read it. Listing links need their own small server-made pages (section 5).
- **No over-the-air updates** without a paid add-on (Shorebird). Every fix goes through the stores.
- **iOS builds need a Mac runner** (GitHub macOS runners or Codemagic) instead of EAS.

## 2. What carries over unchanged

| Keep as is | Notes |
|---|---|
| `supabase/migrations/0001` to `0008`, `supabase/tests/*.sql` | The database, rules (RLS), RPCs and their tests. Flutter talks to the same project. |
| `supabase/functions/*` (suggest-listing, send-push, moderate-listing, `_shared/prohibited.json`) | Same HTTP interface. The push function may need an FCM payload tweak. |
| Product rules and phases in `plan.md` | Browse without an account, account for chat and sell, deals outside the app, Phase 6 parked. |
| Design assets | App icon SVG sources, demo illustrations, mockups. |
| Data tables | Categories, cities with coordinates, countries, prohibited-item rules: export once to JSON and load in Dart. |
| Strings | `i18n/en.ts`, `ar.ts`, `si.ts` converted to ARB files (about 420 keys each). |
| Logic and its tests | `scripts/check-logic.ts` (about 180 checks) is rewritten as Dart tests with the same expected values. |

## 3. What we reuse from the Family Expenses app

Same author, same stack choices, so copy these modules (later, optionally, a shared package):
- `lib/core/theme/*` (ten colour themes, tokens, tinting), `appearance_settings.dart`, `appearance_screen.dart`
- `lib/core/widgets/glass.dart`, `theme/glass_backdrop.dart`, `personal_background.dart`
- `lib/core/layout/*` (window classes, adaptive shell with floating pill bar, side rail, sheets)
- `lib/core/money/*`, `lib/core/supabase/supabase_config.dart`, routing structure
- Project rules in `CLAUDE.md` (one implementation per feature, layout by window width, money in minor units, no hard-coded colours, tests with each feature)

## 4. Mapping: current stack to Flutter

| Now (Expo) | Flutter |
|---|---|
| Expo Router (`app/`) | `go_router` with a shell route for the five tabs |
| React context providers | Riverpod (`prefs`, `auth`, `location`, `inbox`, `engagement`) |
| NativeWind classes, CSS variables | `ThemeData` + `AppTokens` (as in the expenses app) |
| `expo-blur`, gradients, grain | `BackdropFilter`, `RadialGradient`, `GlassBox` / `GlassBackdrop` (ported already) |
| AsyncStorage | `shared_preferences` (prefs, guest likes/follows/saved searches), `flutter_secure_storage` (session) |
| Supabase JS | `supabase_flutter` (auth, REST, realtime, storage, functions) |
| `expo-image`, image picker, manipulator | `cached_network_image`, `image_picker`, `flutter_image_compress` |
| `expo-location` | `geolocator` |
| `expo-notifications` | `firebase_messaging` + `flutter_local_notifications` |
| Share, linking | `share_plus`, `app_links`, `url_launcher` |
| Demo mode (AsyncStorage seed) | Same idea: an in-memory repository with the 18 seeded listings behind the same interfaces |
| Hermes workarounds (`timeAgo`, safe `Intl`) | Not needed: `intl` works on every target |

**Architecture:** `lib/core` (theme, layout, money, supabase, routing), `lib/features/<name>` (home, search, listing, sell, chat, offers, reviews, moderation, profile, welcome, settings), each with `data/` (repository interface, Supabase and demo implementations), `domain/` (models, pure logic) and `ui/`. Layout depends on window width only inside `core/layout`.

## 5. Web and share links

1. **Listing pages for sharing** (server-made HTML with title, price, photo, Open Graph tags): a Supabase Edge Function `listing-page` (or a small Cloudflare Worker) at the real domain, with an "Open in the app / get the app" button.
2. **App links:** `assetlinks.json` (Android) and `apple-app-site-association` (iOS) on the same domain so the link opens the app when installed.
3. **Flutter web** is optional and later (account area, selling from a laptop). It is not the public face of the site.

## 6. Phases

Effort is in rough working sessions with me (one session is a long focused stretch like the ones so far); real time depends on your testing turn-around.

| Phase | Scope | Done when | Effort |
|---|---|---|---|
| **F0 Prototype (decision gate)** | New Flutter project; copy theme and glass from the expenses app; Home screen with location card, tabs, listing grid on demo data; floating glass bar; Settings > Appearance; debug APK. | You compare it with the Expo build on your phone and decide go or stay. | 1 |
| **F1 Foundation** | Repo layout, CI (analyze, test, split-per-ABI APK, `v0.0.1-devN` tags as now), ARB strings en/ar/si, RTL, countries, cities, categories, money, prefs, first-run welcome, effects setting for low-end phones. | App runs in demo mode with welcome, themes, languages. | 2 |
| **F2 Data layer** | `supabase_flutter`; phone OTP and Google/Apple sign-in; repositories (listings, profiles, engagement, threads, notifications, reviews, reports) with Supabase and demo implementations; guest data merged at sign-in; crash screen. | Same screens work against a real project and in demo. | 2 |
| **F3 Browse** | Home feed and tabs, paging, search (Arabic/Sinhala folding, typo tolerance, filters, saved searches), listing detail, seller page, favourites, follow, location, radius, nearest sort, stats RPC, share. | Parity with Expo phases 1 to 3. | 2 |
| **F4 Sell** | Listing form, photo picking and shrinking, AI autofill, drafts, my listings, bump, sold flow. | Parity with Expo phase 2. | 1 to 2 |
| **F5 Chat and offers** | Threads, realtime messages, offers and counters, meet-up proposals, photos, mute/block, unread counts, push (FCM) end to end. | Parity with Expo phase 4. | 2 |
| **F6 Trust and safety** | Reviews and ratings, report (guest included, rate limits), moderation screen, prohibited-item warnings, scam tips, removed state. | Parity with Expo phase 5. | 1 to 2 |
| **F7 Polish and test** | Low-end phone pass (frame-rate overlay, profile mode), accessibility (text scale, 48 dp targets, screen reader labels), golden tests for the glass look, device matrix. | Smooth on a low-end phone; tests green. | 1 to 2 |
| **F8 Launch** | Share-link pages, app links, store listings (ar/en/si), privacy policy, data-safety forms, iOS signing, TestFlight and Play internal track, beta. | Phase 8 of the main plan. | 2 |

**Total:** roughly 14 to 18 sessions. The Expo app stays usable and releasable until F6 reaches parity.

## 7. Testing

- Ported logic checks: money, phones, Arabic and Sinhala text, search and typos, distances, offers, ratings, prohibited items, time-ago.
- Widget tests per feature; golden images for Home in light, dark, pure black and glass vs standard.
- Database tests (`supabase/tests/*.sql`) unchanged and still run on a scratch Postgres.
- Real-device matrix before each beta: a recent iPhone, a recent Android, an older 32-bit Android, English, Arabic and Sinhala, light and dark.

## 8. Risks

| Risk | Mitigation |
|---|---|
| Rewrite introduces regressions | Keep Expo releasable; port tests first; phase-by-phase parity checklist taken from `plan.md`. |
| Search and link previews for web | Server-made share pages (section 5), decided up front. |
| No over-the-air updates | Keep the store cycle short; consider Shorebird later. |
| iOS build setup | Use a macOS runner or Codemagic from F1; budget time for signing. |
| Sinhala and Arabic fonts on web | Bundle Noto Sans Sinhala/Arabic for web; phones use system fonts. |
| Lost momentum | The F0 gate is cheap; stop there if the difference is not worth it. |

## 9. What I need from you

1. A go for **F0** (prototype), and which repo to use: a new branch `flutter` in this repo (Expo moved to `expo-legacy/`, `supabase/` stays at the root) is my recommendation.
2. The final app name and package id before F8 (cannot change after publishing).
3. After F0: your verdict on smoothness and look, on a real phone.
4. Accounts when we reach F2 and F8: Supabase project, Firebase project (push), Apple Developer, Google Play Console, the real domain.
