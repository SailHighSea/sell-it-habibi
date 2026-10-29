# Sell It Habibi — Project Plan

Peer-to-peer marketplace for second-hand and new items, for buyers and sellers in the Middle East and Sri Lanka. Android, iOS and Web from one Expo codebase.

## 1. Status at a glance

Legend: **Built** = code written and checked here (lint, types, tests, a browser run in demo mode, and the database migrations run on a real Postgres). **Needs your accounts** = built, but it only runs for real once you set up the service. Nothing has been run on a physical phone yet.

| Phase | Built | Still open |
|---|---|---|
| 0. Foundation | App, tabs, Arabic/RTL, theme, Supabase schema and client, EAS config, CI and release workflows | DM Sans / Arabic font; **your** accounts, `eas init`, Supabase project, first `v0.1.0` release |
| 1. Accounts and profiles | Phone sign-in, Google/Apple sign-in, onboarding, profile, settings, demo mode | Turn on providers in Supabase; test on real devices; account deletion |
| 2. Listings | Category tree, create/edit form, photos, AI autofill, manage listings, drafts | Drag-to-reorder photos, bulk "Post all", filters on Manage listings; AI function and photo upload untested for real |
| 3. Discovery | Feed tabs, search (Arabic-aware, typo-tolerant, filters, saved, radius, nearest, best match), paging, detail page, favourites, follow, share; **Nearby by real distance** (approximate pins, phone location or city, radius), Home location card | A map view of the pins; the real share domain; thumbnails for lists |
| 4. Chat and offers | Chat, offers, meet-ups, Chats and Updates tabs, mute/block/report, push code, floating pill bottom bar | Push end to end (phone, credentials, webhook), realtime on a real project, live location |
| 5. Trust and safety | Reviews and ratings, mark-sold-to-a-buyer, report a listing, moderation screen (queue, warn, remove, ban), prohibited-items list with warnings and blocks, scam tips, automatic checks function, database rules (migration `0004`) | Legal review of the prohibited list, ID verification (deferred), real-project test of the moderation function |
| 6. Transactions | **Later, not in the current scope** (all deals happen outside the app) | Kept below for the future |
| 7. Growth and monetization | Free bump (from Phase 2) | The rest; anything paid waits for Phase 6 |
| 8. Launch | App icon, first-run welcome, ten colour themes (same as the expenses app), glass look, light / dark / pure black, performance pass, Sri Lanka and Sinhala, numbered test APKs | Real-phone testing, accessibility and security review, Sinhala review, Tamil, store listings, beta |
| 9. Post-launch | Nothing yet | Everything below |

### Product rules (decided)

1. **No account to browse.** Home, search, listing pages, seller pages, sharing, language and country settings need no sign-in. Likes, follows and saved searches also work without an account: they are kept on the phone and moved into the account when the person signs in later.
2. **An account is needed only to chat and to sell.** That means Chat and Make an offer on a listing, the Chats and Updates tabs, creating and managing listings, and the profile. Reporting a listing or a person needs no account either (see Phase 5 for the limits that stop abuse).
3. **Deals happen outside the app.** The app connects buyers and sellers: listings, chat, offers and meet-up proposals are tools for agreeing. Payment, handover and delivery are arranged by the two people themselves (meet-up, cash, bank transfer, their own courier). Because of that there is no cart, checkout, escrow or "Buyer Protection" for now. The deal methods on a listing (meet-up, delivery, cash on delivery) are information for buyers; the app does not take payment or ship anything.

### Test builds on a phone

| Build | What happened |
|---|---|
| `apk-1` (first test APK, 47 MB) | **Crashed on a real phone.** Cause found: the Android JavaScript engine (Hermes) has no `Intl.RelativeTimeFormat`, and every listing card called it for "2 hours ago". It worked in the browser, which is why my tests missed it. Fixed: the labels are now written by hand (English and Arabic, with correct Arabic plural forms), every other `Intl` call falls back safely, and the Unicode regex was replaced. |
| `apk-2` to `apk-13`, then `v0.0.1-dev1`, `v0.0.1-dev2` | Built by GitHub from the `release` branch, one APK per phone type (about 45 MB for `arm64-v8a`, 39 MB for `armeabi-v7a`). Not yet confirmed on a real phone after the crash fix. The numbered releases (`v0.0.1-devN`) also set the app version shown in Settings. |

**Why the first APK was large (47 MB) and what changes it.** The 64-bit phone build holds about 21 MB of native code (React Native, the JavaScript engine, animations), 17 MB of compressed app code that was **not shrunk** (45 MB before compression), a 4 MB JavaScript bundle and about 3 MB of fonts and images. Two things reduce it:
1. **Separate APKs per phone type.** The workflow now builds `arm64-v8a` (modern phones) and `armeabi-v7a` (older 32-bit phones) as separate files, so each phone downloads only its own. The 64-bit file is the same size as before (it already held only 64-bit code), but a combined APK for all phone types would have been about 80 MB or more. The Play Store does this automatically with an app bundle and also splits by screen density.
2. **Shrinking the code and resources (R8).** Possible with the `smaller` option when you run the APK workflow by hand (about 10 MB less per phone type, e.g. 35.4 MB instead of 45.2 MB), but it is **not used any more**: only the standard APK is released.

**What the app does today (demo mode, no backend needed):** a first-run welcome (language, country, city or detect it, look); browse, search (typo-tolerant, by distance), like, follow and save searches without an account; a Home with a nearby card and real distances; ten colour themes, light / dark / pure black, glass or flat, gradient or plain; English, Arabic and Sinhala; seven countries (UAE, Saudi Arabia, Qatar, Kuwait, Bahrain, Oman, Sri Lanka); sign in with a demo code to chat or sell; set up a profile, list an item from a photo, manage listings, chat with a demo seller, make and counter offers, propose meet-ups, mark sold, review, report and use the moderation screen.

**What needs you:** Apple and Google developer accounts, a Supabase project (run migrations `0001` to `0008`), an Anthropic API key for the photo autofill, and EAS credentials for pushes. The steps are in `README.md` and section 7.

**Checks that run in CI:** lint, typecheck and `npm test` (about 180 checks of the pure logic: money, phones, Arabic and Sinhala text, search and typos, distances, offers, ratings, prohibited items). `supabase/tests/` holds database checks you can run on a scratch Postgres.

Files added along the way: `eas.json`, `app.json` ids (`com.sellithabibi.app` is a **placeholder**; ids can't be changed after publishing), `.github/workflows/ci.yml` and `release.yml`, `supabase/migrations/0001` to `0008`, `supabase/functions/suggest-listing`, `send-push` and `moderate-listing`, `design/mockups.html`.

## 2. Reference: what a full-featured marketplace covers

| Area | Typical full-featured marketplace | Our equivalent |
|---|---|---|
| Explore | Search + camera search, cart, chat; category tabs; shortcuts (Likes, Cars, Trade-in); feed tabs Top picks / Nearby / Free Items / Certified / Following; cards with age, price, condition, seller, Buyer Protection badge, heart | Same layout; localized categories; RTL. No Buyer Protection badge (deals are outside the app) |
| Sell flow | Create a listing, or sell directly to the platform (mobile, luxury, fashion, cars); photo upload then **AI extraction of details**; "Fill in manually"; multiple listings, "Post all" | Photo-first listing with AI autofill, bulk posting |
| Listing form | Category tree, title, condition, type, description templates (Casual / Simple / Bullet points / Write my own), For Sale / For Free, price validation, Fixed price, Pre-order, deal method (meet-up, official delivery) | Same, plus Cash on Delivery, Arabic/English description |
| Manage listings | Search, filters, Active / Inactive / Others, likes count, View insights, Promote | Same |
| Me | Rating and reviews, Selling/Buying tabs, My listings, My sales, lifetime earnings, Balance, Selling preferences, Live shows, Plus, Buddies, Promotions, Biz, Coins, Shoutout, username-privacy warning | Core first, growth features later |
| Nav | Explore, Interests, Sell, Updates, Me | Floating pill: Home, Search, Chats, Updates, Me, with a floating "+ Sell" button. Favourites replace the Interests tab for now |

## 3. Middle East specifics

- **Arabic-first**: RTL (`I18nManager`), Arabic + English UI and listing text, Arabic search normalization (hamza, tashkeel, ta marbuta).
- **Markets / currencies**: UAE (AED), KSA (SAR), Qatar (QAR), Kuwait (KWD, 3 decimals), Bahrain (BHD), Oman (OMR), **Sri Lanka (LKR)**; Egypt and Jordan later.
- **Payments**: outside the app for now (cash at meet-up, bank transfer, or whatever the two people agree). Cards, Apple Pay, mada, STC Pay and Tabby/Tamara through a regional gateway (Tap, HyperPay, Checkout.com, PayTabs) are a later phase (Phase 6).
- **Delivery**: arranged by the two people (meet-up is the default). Courier integration (Aramex, SMSA, J&T, Naqel, Careem Box) is part of the later Phase 6.
- **Trust and safety**: phone OTP (SMS/WhatsApp), ID verification above a threshold, per-country prohibited items (alcohol, pork, weapons…), scam warnings, reviews and reporting. With deals outside the app there is no escrow, so trust comes from verification, reviews and moderation.
- **Compliance**: UAE/KSA PDPL, App Store UGC rules (report/block/EULA, account deletion). Consumer-protection and VAT rules matter more once payments come in (Phase 6).

## 4. Tech stack

| Layer | Choice |
|---|---|
| App | Expo SDK 57, Expo Router, TypeScript, NativeWind (existing) |
| Backend | Supabase (Postgres + RLS, Auth, Storage, Realtime) — the `services/` layer is already designed to swap to it |
| Search | Postgres full-text first; Meilisearch/Typesense when Arabic relevance needs it |
| Chat | Supabase Realtime + Expo push notifications |
| AI | Claude API (vision) via a backend function for photo-to-listing, translation, moderation |
| Media | Supabase Storage / CDN, `expo-image`, blurhash |
| Payments | None for now. Regional gateway if Phase 6 is built |
| Builds / release | EAS Build + Submit, triggered from GitHub Actions |
| Monitoring | Sentry, PostHog |

## 5. Phases

Each phase ends with a build in TestFlight and the Play internal track.

### Phase 0 — Foundation
- [x] Expo app, tabs, responsive navigation (bottom bar / sidebar), mock feed
- [x] CI workflow, EAS config (development / staging / production env per profile), release workflow
- [x] Localization (English + Arabic) with RTL; language and country in Settings; device-language default
- [x] Theme tokens from the Family Expenses look (Forest palette, light + dark), gradient header, pill buttons
- [x] Supabase client, schema v1 with row-level security (`supabase/migrations/0001_init.sql`), typed services replacing the mock (mock kept for demo mode)
- [x] Money as integer minor units, country and currency table (AED, SAR, QAR, KWD, BHD, OMR, LKR)
- [ ] Load DM Sans and an Arabic font (currently the system font)
- [ ] **You:** confirm app name, bundle id / package, icons
- [ ] **You:** Apple Developer + Google Play Console accounts; `eas init`; `EXPO_TOKEN` secret; first manual store uploads
- [ ] **You:** create the Supabase project and run migrations `0001` to `0008` in order
- [ ] First tag release (`v0.1.0`) to validate both pipelines

### Phase 1 — Accounts and profiles
- [x] Phone OTP sign-in with country picker and local number validation (Arabic digits accepted)
- [x] Google and Apple sign-in through Supabase OAuth (needs provider setup, see README)
- [x] No account needed to browse; sign-in is required only for chat and sell (route guards for sign-in and onboarding)
- [x] Onboarding: display name, country, city, interests. Names that look like an email or phone number are rejected in the app and in the database
- [x] Profile: view, edit (photo, name, bio, city), sign out
- [x] Settings: language, country and currency, notifications preference
- [x] Demo mode so everything works before a backend exists
- [ ] **You:** enable Phone / Google / Apple providers in Supabase and add redirect URLs
- [ ] Test on real iOS and Android devices (verified so far: lint, typecheck, web build, and a browser run of sign-in, onboarding, persistence and Arabic/RTL)
- [x] Notification permission and push token registration (code written in Phase 4; needs a real phone and EAS to run)
- [ ] Account deletion (required by the App Store; add before submission)

### Phase 2 — Listings
- [x] Category tree (8 top-level, 20 second-level) with per-category fields (cars: year, mileage, transmission; phones: brand, storage; property: bedrooms, area…)
- [x] Create-listing form: up to 10 photos from the library or camera, reorder with arrows, remove, title, category and type, condition, description templates (Casual / Bullet points / Short / Write my own), For sale or Free, fixed price, pre-order, deal methods shown to buyers (meet-up, delivery, cash on delivery; the app doesn't handle payment or shipping), city
- [x] **AI autofill from the first photo** (Supabase Edge Function calling Claude; output is sanitised in the app; the form stays manual if it fails)
- [x] Manage listings: Active / Inactive / Sold tabs with counts, search, edit, activate / deactivate, mark sold, bump (once an hour, enforced in the database), delete with confirmation
- [x] Drafts (text fields; photos are not kept)
- [x] Photos stored in the `listing-images` bucket, in the seller's own folder
- [ ] Drag-and-drop photo reorder (arrows for now)
- [ ] Bulk "Post all" (several items from several photos at once)
- [ ] Filters on Manage listings (search only for now)
- [ ] **Not yet tested against the real Claude API or real Supabase storage** (the Edge Function and photo upload are written but have only run against demo mode; see README to deploy)

### Phase 3 — Discovery
- [x] Home feed tabs: For you (ranked by your interests, freshness and likes), Top picks (most liked), Nearby (your city), Free, Following
- [x] Category chips, listing detail (photo gallery, price, condition, details, deal methods, seller card), seller page
- [x] Search: Arabic-aware text matching (hamza, alef maqsura, ta marbuta, diacritics, Arabic digits), filters (category, condition, price range, free only), sort, saved searches
- [x] Likes with a Favourites screen, follow sellers, saved searches: all work without an account (kept on the phone) and move into the account at sign-in
- [x] Share through the system sheet and WhatsApp
- [x] Postgres schema for all of this: trigram index on the normalised text, like counter trigger, follows, saved searches (migration `0002`)
- [x] **Nearby by real distance.** Listings carry an approximate pin (area centre nudged up to ~400 m, migration `0006_geo.sql`, tested); the phone's location (optional, stays on the phone) or a chosen city is the origin; radius 5 to 100 km; cards show distance; Search has a radius and Nearest sort. Pinless listings fall back to their city's centre. **Still to do:** an actual map view of the pins
- [x] Interests tab: Home's "For you" ranks by the interests picked at sign-up, then freshness and likes
- [x] Paging (20 at a time, loads more as you scroll), typo-tolerant search (one typo from 4 letters, two from 8) and best-match ranking. Server search still uses `ilike`; for very large catalogues add `pg_trgm` or Postgres full-text search
- [ ] **You:** pick the real domain. Share links use a placeholder domain (`APP_URL` in `constants/theme.ts`); set the real domain and deep-link handling before launch

### Phase 4 — Chat and offers
- [x] One conversation per buyer and listing, opened from Chat or Make an offer on a listing; photos and text; quick replies ("Is this still available?")
- [x] Chat and Make an offer need an account. Offers are a way to agree a price; money changes hands outside the app.
- [x] Offers: make, counter, accept, decline. The database enforces the rules (fixed price listings take the listed price only, free and sold items take none, a new offer replaces the pending one, you can't answer your own offer)
- [x] Meet-up proposals (place, day, time from the next 6 days; today's past slots hidden) and a safety tip in every chat
- [x] Chats tab with unread counts, Updates tab (offers, messages, meet-ups), badges on the tabs
- [x] Block, mute, report (scam, spam, abusive, prohibited item, other). Blocking stops messages and offers both ways; reports can't be read through the API
- [x] Realtime messages (Supabase Realtime), chat photos in a private bucket with short-lived links
- [x] Push: token registration, `push_tokens` table, `send-push` Edge Function; tapping a push opens the chat
- [x] Bottom bar redesigned as a floating pill like the Family Expenses app, with a floating "+ Sell" button
- [ ] **Push is not tested end to end.** It needs a real phone, an EAS project, FCM/APNs credentials and the database webhook (see README)
- [ ] Realtime is not tested against a real Supabase project (checked against the database and in demo mode only)
- [ ] Sharing your live location (needs `expo-location`); meet-ups use a typed place name for now
- [ ] Marking an item sold from an accepted offer (today the seller does it in My listings)
- [ ] Push text shows both languages because the server doesn't know each person's language yet
- [ ] Moderation queue for reports (Phase 5)

### Phase 5 — Trust and safety (built; needs a real project to test the server parts)
Done means built and checked here (lint, types, tests, a browser run in demo mode, database tests on Postgres 16). Nothing has run on a real phone or a real Supabase project yet.

**Database (migration `0004_trust.sql`, tests in `supabase/tests/behaviour-trust.sql`)**
- [x] Reviews: one per sold item, 1 to 5 stars and an optional comment, written only by the buyer the seller marked the item sold to; the seller's average and count update automatically; a review survives if the listing is deleted
- [x] `mark_sold`: only the seller, and only to someone who chatted about that item; the buyer is asked for a review. A buyer keeps seeing the item they chatted about or bought after it is sold
- [x] Staff roles (moderator, admin) that nobody can give themselves
- [x] Moderation queue: user reports and automatic flags in one table; staff can dismiss, warn, remove a listing or ban a user; everyone affected is told
- [x] Bans: a banned person can't post, start chats, message or make offers; staff can lift a ban
- [x] Removed listings: hidden from everyone but the owner and staff, and sellers can't bring them back

**App**
- [x] "Mark as sold" asks who bought it (people from that item's chats, or "sold outside the app"); the chosen buyer gets a review request in Updates and a banner in the chat
- [x] Review screen (stars and comment); rating and reviews on seller pages, on your own profile ("My reviews"), and in the seller card on a listing
- [x] Moderation screen for staff (Profile > Moderation): open and closed reports, automatic flags, warn / remove listing / ban / dismiss with an optional note, lift a ban
- [x] Report a listing from its page, **with or without an account**; owners see "Removed by moderators" on removed listings, which can only be deleted
- [x] Per-country prohibited-items list (`supabase/functions/_shared/prohibited.json`, one file shared by the app and the server): "block" items (weapons, drugs, fake documents, adult content) stop the listing, "warn" items (alcohol, pork in some countries, tobacco and vapes, medicine, replicas, live animals) show a notice
- [x] Scam tips on every listing page you don't own
- [x] Demo mode: you are an admin, so the moderation screen can be tried; reports you file appear in its queue

**Reporting without an account (migration `0005`, tests in `supabase/tests/behaviour-report.sql`)**
- [x] Guests can report a listing or a person. All reports go through one database function that allows at most 5 reports an hour per account or, for guests, per phone and network address (only a one-way hash is stored), one open report per listing per reporter, and takes the person being reported from the listing itself. Direct writes to the reports table are closed. Moderators see guest reports labelled "Reported by a guest"
- [ ] Guest reports have no reporter to follow up with; a determined person could still create many reports from many phones, so watch the queue after launch

**Server function**
- [x] `supabase/functions/moderate-listing`: checks new and edited listings against the prohibited-items list and, if `ANTHROPIC_API_KEY` is set, with Claude (text and the first two photos), and adds anything suspicious to the queue. It never removes a listing by itself; a person decides. Needs a Database Webhook (see README)
- [ ] Not run against a real project or the real Claude API yet

**Still open**
- [ ] **Legal review of the prohibited-items list for each country.** It is a starter list written by an engineer
- [ ] ID verification and seller badges beyond the phone check (needs a paid provider such as Onfido or Sumsub; deferred)
- [ ] Reporting or disputing a review (reviews can't be removed by staff yet)
- [ ] Auto-removal of "block" items (today they are flagged to the queue only, until we know the false-positive rate)
- [ ] Push notifications for review requests and moderation notices use the generic text (server pushes are still untested)
- [ ] Staff tooling beyond the queue: search users, see a person's history, bulk actions

### Phase 6 — Transactions (later, not in the current scope)

All deals happen outside the app for now (see Product rules). This phase stays here for the future and is **not planned or scheduled**. Nothing in Phases 0 to 5 depends on it.

- [ ] Cart, checkout, Buyer Protection (escrow), My sales / orders
- [ ] Payment gateway (cards, Apple Pay, mada, STC Pay, BNPL) and Cash on Delivery
- [ ] Courier integration, balance and IBAN payouts, insights (views, likes, earnings)
- [ ] Consumer-protection and VAT review per country before taking payments

### Phase 7 — Growth
Without payments in the app, this phase is limited to free features.
- [x] Free bump once an hour (from Phase 2)
- [ ] Referrals, gamification, camera search
- [ ] Certified / verified listings (a free badge after checks)
- [ ] Live shows (stretch)
- [ ] **Needs Phase 6 first (later):** paid promotion, promotions and coupons, Shoutout, Plus subscription, business accounts, sell-to-platform and trade-in

### Phase 8 — Launch
- [x] **App icon:** direction 6 (souk awning with a hanging price tag) is in: 1024px icon, Android adaptive (foreground, background, one-colour), splash light/dark, notification icon, favicon, in-app logo. Sources and regenerate commands in `design/README.md`
- [ ] Performance, accessibility, security review
- [ ] Test on real phones before each release: a recent iPhone, a recent Android, an older 32-bit Android, in English and Arabic, light and dark. Browser tests cannot catch phone-only problems (the first APK crash was one)
- [x] Two app looks, chosen in Settings and saved on the device: **Frosted glass** (default) and **Classic flat**. Surfaces and borders are colour variables (`constants/looks.ts`), so every card, field and chip switches together; the floating bar, form footers and sheets use real blur (`components/ui/frost.tsx`, expo-blur); screens get a gradient backdrop (`backdrop-layer.tsx`). The bottom pill floats with no background band in both looks. Blur is kept off list cards on purpose (cost on mid-range Android)
- [x] Home redesigned to the new mock: header with tagline and search pill, location card (city arrows, radius, New today / Free items / Verified sellers), then tabs
- [x] **Performance pass** (works the same on weak and strong phones):
  - Visual effects setting (Automatic / Full / Reduced). Automatic switches to the flat Classic look on phones with under about 3.5 GB of memory or Android 9 and older (`lib/device-class.ts`)
  - Photos are shrunk before upload and before AI reading: longest side 1280 px (1024 for AI), JPEG, typically 150 to 300 KB instead of 3 to 6 MB (`lib/photo.ts`)
  - Home's "near you" counts come from one database call (`nearby_stats`, migration `0007`) instead of fetching hundreds of listings
  - Lists draw 6 rows at first, keep a small window and drop off-screen rows; the feed pages 20 at a time; blur only on the bar, footers and sheets
  - **Bug fixed in `0007`:** signed-out visitors could not read listings on a real project (0004's policy called `is_staff()`, which had been revoked from `anon`). Demo mode and the earlier tests did not catch it
  - **Still to do:** profile on a real low-end phone (frame rate, memory, startup time), serve small thumbnails in lists (needs Supabase image transforms or a second upload), skip loading Arabic or English strings that are not used
- [x] **Sri Lanka added** (country `LK`, rupees, +94, 16 cities with map centres, demo listings, migration `0008_sri_lanka.sql` with a test). English and Sinhala work today. **Still needed for a good Sri Lanka launch:**
  - **Sinhala added** (all ~420 strings, categories, country and Sri Lankan city names, time and distance wording, a few prohibited-item words). It is a first draft by Claude: **have a native speaker review it** (tone, spelling, terms like "මොඩරේටර්", "අබායා"). Tamil is still missing and is spoken by many in the north and east; it can reuse the same structure (`i18n/ta.ts`, a `ta` entry in the name tables). Sinhala text needs a Sinhala font on the phone: Android and iPhone have one built in, but check older Android models
  - Sri Lanka categories and wording: three-wheelers (tuk-tuks), motorbikes, sarees and sarongs, and `Majlis`/`abaya` categories hidden for LK
  - Review the prohibited-items list for Sri Lanka with a local lawyer (it currently copies the Gulf list; pork is not restricted there)
  - Check the SMS provider reaches Sri Lankan carriers (Dialog, Mobitel, Hutch, Airtel) at a reasonable price; consider a local sender ID
  - Payments are out of scope, but the in-person meet-up and cash flow should be checked for local habits (WhatsApp is common)
- [x] **First-run welcome** (2 steps): language, country, city (detect with permission, or pick; the phone's position can switch the country too), then light or dark, colours, look, background and effects. Shown once; everything stays in Settings. **Background** (gradient or plain) is now a separate setting from Look
- [x] **Glass effect ported from the Family Expenses app** (`lib/glass.ts`, `components/ui/frost.tsx`, `backdrop-layer.tsx`; source: `lib/core/widgets/glass.dart` and `glass_backdrop.dart` there): translucent tint (0.64 light, 0.58 dark), a soft white sheen from the top left, a thin light edge, and a backdrop of a pale or deep base with three radial colour patches. Live blur only on the bottom bar, pinned footers and sheets, never on list cards. The personal-photo background and per-card strength options from that app are not ported
- [x] **Test builds are now numbered `v0.0.1-dev1`, `v0.0.1-dev2`, …** (earlier ones were `apk-1` to `apk-13`). The number is the next one after the highest existing tag; a smaller (R8) build started while the standard one is still running gets the same number plus `-smaller`. The number is also the app's version (Settings shows `0.0.1-devN`) and the Android version code. APK files are named `sell-it-habibi-v0.0.1-devN[-smaller]-<phone type>.apk`
- [x] **Same themes as the Family Expenses app:** all ten (Forest, Ocean, Sunset, Graphite, Lavender, Rose, Lagoon, Indigo, Mocha, Citrus) with the same colour values and the same way of tinting the page, cards, edges and text (`constants/palettes.ts`, ported from `color_themes.dart`; keep the two in step). **Pure black** now makes the page, header and backdrop true black. The old "Royal" theme became Lavender
- [x] **Bottom bar rebuilt like the expenses app's** (`components/layout/floating-bar.tsx`): 74 px glass pill at the app root, chosen tab in a lighter pill, text and icons in the theme's text colours. **Why the blur was missing on Android:** expo-blur only blurs there when the content is wrapped in a blur target (`components/ui/blur-target.tsx`); without it the bar was just a tint and the cards behind it stayed sharp. Footers and sheets get a stronger tint on Android instead of a blur. Not yet seen on a real phone
- [x] **Only the standard APK is released from now on** (decided: the `-smaller` build is not needed). Pushing to `release` builds `v0.0.1-devN` for both phone types; the `smaller` switch stays in the workflow's manual run but nobody needs to use it. Older `-smaller` pre-releases (apk-3, 6, 8, 11, 13 and `v0.0.1-dev1-smaller`) stay as they are
- [x] **Appearance settings laid out like the expenses app's:** Mode as one segmented control (System / Light / Dark / Pure black), the ten colour themes as two-column cards with the hero, accent and track preview and a "Selected ✓" tag, and Look as two rows (Standard, Glass) with a description and thumbnail. The bar's blur was too weak on Android (intensity 45 divided by 4 gave about 11 px, which looked like no blur); it is now 100 (about the expenses app's blur). Not yet confirmed on a real phone. Still different from the expenses app: its font (DM Sans), its personal-picture backgrounds, and a "Preview in dark mode" button
- [x] README screenshots (demo mode, web build, EN/AR, light/dark) in `docs/screenshots/`; demo listings now use illustrated photos
- [ ] Store listings (ar/en), store screenshots from real devices, privacy policy, terms, data-safety forms. No in-app purchases of goods, which keeps store review simpler
- [ ] Beta then soft launch in one country (UAE or KSA), then expand

### Phase 9 — Post-launch
- [ ] Analytics, A/B tests, ranking, more countries/carriers, admin tooling

## 6. Risks

| Risk | Mitigation |
|---|---|
| Cold start | Launch one country/city, seed sellers |
| Scams and prohibited items | Verification, reviews, moderation, reporting |
| Arabic search quality | Normalization, dedicated engine when needed |
| App Store UGC review | Report/block, moderation, EULA before submission |
| Deals outside the app (no escrow, so scams can't be refunded) | Seller verification, reviews, reporting and moderation, scam tips in chat; Phase 6 if it becomes necessary |
| Per-country payment/regulatory differences | Not a risk until Phase 6 is built |
| Expo SDK churn (SDK 57) | Use `npx expo install`, check versioned docs, `expo-doctor` in CI later |

## 7. Release pipeline (GitHub Actions + EAS)

To try the app on your phone: push to the `release` branch, then open the newest pre-release under the repo's Releases and install **one** `.apk` (the `arm64-v8a` one for most phones). The EAS workflow below is for store builds and needs your Expo, Apple and Google accounts.

- `ci.yml` — on PRs and `main`: `npx expo lint`, `npx tsc --noEmit` and `npm test`.
- `android-apk.yml` — **test APKs, no accounts needed.** Runs when the `release` branch is pushed (or by hand): checks types and tests, builds two installable Android APKs (`arm64-v8a` for modern phones, `armeabi-v7a` for older 32-bit phones) and attaches them to a GitHub pre-release you can download on your phone. Each release is tagged `v0.0.1-devN` (N counts up; see Phase 8) and the APK files carry the same name. A `smaller` switch exists for manual runs but is not used. Debug-signed, demo mode unless Supabase variables are set. Not for the Play Store.
- `release.yml` — on a `v*` tag or manual run: lint, typecheck, then `eas build --profile production` for Android (AAB) and iOS (IPA) with `--auto-submit` to Google Play (internal track) and TestFlight. Builds happen on EAS cloud workers, so no Mac runner is needed. It queues the builds (`--no-wait`); follow progress on expo.dev.
- Manual runs let you pick `android`, `ios` or `all`, and skip submit.

### One-time setup
1. Create an Expo account and project; run `npx eas-cli@latest init` locally and commit the `extra.eas.projectId` it adds to `app.json`.
2. Add the repo secret `EXPO_TOKEN` (expo.dev → Access tokens).
3. iOS: run `eas credentials` once (or let `eas build` prompt) and sign in with your Apple Developer account so EAS can manage the certificate and profile. For submit, add an App Store Connect API key (`eas credentials`) and create the app in App Store Connect.
4. Android: let EAS generate the upload keystore. Create the app in Play Console and upload the first AAB by hand (Google requires this); then add a Google service-account key via `eas credentials` and set it up for `eas submit`.
5. Replace the placeholder `com.sellithabibi.app` id if needed, then push `v0.1.0`.

Version numbers: `eas.json` uses remote versioning with `autoIncrement`, so build numbers / version codes increase automatically; bump `version` in `app.json` for marketing releases.

## 8. Next actions
1. Create the Supabase project, run migrations `0001` to `0008`, enable the Phone provider (and Google / Apple), fill `.env`.
2. Deploy `suggest-listing`, `send-push` and `moderate-listing`, add the two database webhooks (notifications, listings), make yourself an admin (README), and try Sell, Chat, review and moderation on two real phones.
3. Have the prohibited-items list reviewed for each country, and decide about ID verification.
4. `eas init`, add `EXPO_TOKEN`, confirm the bundle id, then tag `v0.1.0` to test both release pipelines.
5. Install the newest `v0.0.1-devN` APK and confirm it opens and feels right on a real phone: the welcome screen, the glass bottom bar (Android blur), themes, Pure black, Sinhala and Sri Lanka. Report what looks wrong.
6. Pick the final app name before the first store upload (the package id can't change after publishing).
7. Get the Sinhala text reviewed by a native speaker; decide on Tamil and the Sri Lanka categories.
8. Next build step: a map view of listings, Phase 7 (free growth features) or the rest of Phase 8 (accessibility, security review, account deletion, store listings). Phase 6 (transactions) stays parked.
