# Sell It Habibi! (Flutter prototype, phase F0)

The decision-gate prototype from `docs/flutter-migration-plan.md`. The Expo app in the repo root is unchanged and still the
shipping app. Nothing here touches `supabase/`.

## What is in F0

- Theme, ten colour themes, tokens and the Glass look, ported from the Family Expenses app (`lib/core/theme`, `lib/core/widgets/glass.dart`).
- Adaptive shell (`lib/core/layout`): floating glass bar under 600 dp, side rail from 600 dp, sidebar from 1200 dp.
- Home on demo data (`lib/features/home`): gradient header, location card with city stepping, feed tabs, category chips, listing grid.
- Me > Appearance (`lib/features/settings`): mode, colour theme, Standard/Glass look, header style, larger text, light effects.
- Search, Chats, Updates and Sell are placeholders for later phases.

Strings are English and inline for now; ARB files, Arabic/Sinhala and RTL come in F1.

## Run

```bash
cd flutter
flutter pub get
flutter run
flutter analyze && flutter test
```

Flutter 3.47.8 (the same as the expenses app). The `dev` branch builds debug APKs in GitHub Actions (`flutter-apk.yml`).

The Android/iOS package id is the placeholder `com.sellithabibi.sell_it_habibi`; it is fixed before F8.
