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
  _layout.tsx       Root stack + providers
  (tabs)/           Home, Search, Sell, Chats, Profile
components/
  layout/           BottomBar (mobile), Sidebar + WebHeader (wide web)
  ui/               Reusable UI (ListingCard, PlaceholderScreen)
constants/          Navigation items, theme, brand colors
hooks/              useIsWideScreen, useGridColumns
services/           Data access (mock listings now; swap for Supabase)
```

## Responsive navigation

`components/layout/responsive-tab-bar.tsx` renders the bottom bar on native and on web below 768px,
and the left sidebar plus top search header on web at 768px and wider. Change the breakpoint in `constants/navigation.ts`.
To add a tab: add an entry to `NAV_ITEMS` and a matching file in `app/(tabs)/`.

## Styling

Use Tailwind classes via `className`. Brand colors live in `constants/colors.js` (`brand-600`, etc.) and feed `tailwind.config.js`.
Dark mode follows the system setting (`dark:` variants).
