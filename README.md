# Sell It Habibi!

Peer-to-peer marketplace for the Middle East (Android, iOS, Web). Expo SDK 57, Expo Router, TypeScript, NativeWind v4.

## Run

```bash
npm install
npx expo start          # press a (Android), i (iOS), w (web)
```

## Structure

```
app/              Screens (file-based routing)
  _layout.tsx       Root stack, providers, route guards
  (tabs)/           Home, Search, Sell, Chats, Profile
  sign-in, verify   Phone OTP + Google/Apple (signed-out only)
  onboarding        First-run profile setup (new accounts only)
  edit-profile, settings
components/
  layout/           BottomBar (mobile), Sidebar + WebHeader (wide web)
  ui/               Button, TextField, Chip, Avatar, Screen, GradientHeader, ListingCard…
constants/          Navigation, colors/theme tokens, countries + currencies
hooks/              useIsWideScreen, useGridColumns
i18n/               en.ts (source of keys) and ar.ts (typed to match)
lib/                supabase client, money (integer minor units), phone, display-name
providers/          PrefsProvider (language, RTL, country), AuthProvider
services/           auth, profile, listings (Supabase, or local demo data when unconfigured)
supabase/migrations SQL schema with row-level security
design/mockups.html UI mockups (mobile + web)
```

## Backend (Supabase)

Without environment variables the app runs in **demo mode**: sample listings, and sign-in accepts the code `123456`. Data stays on the device.

To connect a real backend:

1. Create a Supabase project and run `supabase/migrations/0001_init.sql` in the SQL editor (or `supabase db push`).
2. Authentication > Providers: enable **Phone** (choose an SMS provider such as Twilio; check it covers UAE/KSA numbers), and optionally **Google** and **Apple**. Add `sellithabibi://auth/callback` and your web origin to the redirect URLs.
3. Copy `.env.example` to `.env` and fill in `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. For EAS builds set the same two as EAS environment variables.

The anon key is safe to ship; access is enforced by row-level security in the migration.

## Language and layout direction

English and Arabic. The language defaults to the device language and can be changed in Settings. On web the page direction flips immediately. On Android and iOS the layout direction changes the next time the app is opened. Add UI text to `i18n/en.ts` first, then `i18n/ar.ts` (the type checker flags a missing key).

Money is always stored as integer minor units (`lib/money.ts`); never use floats for prices.

## Responsive navigation

`components/layout/responsive-tab-bar.tsx` renders the bottom bar on native and on web below 768px,
and the left sidebar plus top search header on web at 768px and wider. Change the breakpoint in `constants/navigation.ts`.
To add a tab: add an entry to `NAV_ITEMS` and a matching file in `app/(tabs)/`.

## Styling

Use Tailwind classes via `className`. Brand colors live in `constants/colors.js` (`brand-600`, etc.) and feed `tailwind.config.js`.
Dark mode follows the system setting (`dark:` variants).
