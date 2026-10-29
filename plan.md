# Sell It Habibi — Project Plan

Peer-to-peer marketplace for second-hand and new items in the Middle East, in the style of Carousell (Asian market). Android, iOS and Web from one Expo codebase.

## 1. Where we are today

Already in `main`:
- Expo SDK 57, Expo Router, TypeScript, NativeWind v4 (README / AGENTS.md describe the conventions)
- 5 tabs: Home, Search, Sell, Chats, Profile; responsive nav (bottom bar on mobile, sidebar on wide web)
- Home feed with category chips and `ListingCard` grid, backed by **mock data** in `services/listings.ts` (AED)
- Search, Sell, Chats, Profile are **placeholders**

Added with this plan:
- `eas.json` (development / preview / production profiles, Play internal track)
- `app.json`: `ios.bundleIdentifier` and `android.package` = `com.sellithabibi.app` (**placeholder, change before the first store upload; ids can't be changed after publishing**)
- `.github/workflows/ci.yml` (lint + typecheck) and `release.yml` (Android + iOS release via EAS)

## 2. Reference: what Carousell does (from screenshots)

| Area | Carousell | Our equivalent |
|---|---|---|
| Explore | Search + camera search, cart, chat; category tabs; shortcuts (Likes, Cars, Trade-in); feed tabs Top picks / Nearby / Free Items / Certified / Following; cards with age, price, condition, seller, Buyer Protection badge, heart | Same layout; localized categories; RTL |
| Sell flow | Create a listing, or sell directly to the platform (mobile, luxury, fashion, cars); photo upload then **AI extraction of details**; "Fill in manually"; multiple listings, "Post all" | Photo-first listing with AI autofill, bulk posting |
| Listing form | Category tree, title, condition, type, description templates (Casual / Simple / Bullet points / Write my own), For Sale / For Free, price validation, Fixed price, Pre-order, deal method (meet-up, official delivery) | Same, plus Cash on Delivery, Arabic/English description |
| Manage listings | Search, filters, Active / Inactive / Others, likes count, View insights, Promote | Same |
| Me | Rating and reviews, Selling/Buying tabs, My listings, My sales, lifetime earnings, Balance, Selling preferences, Live shows, Plus, Buddies, Promotions, Biz, Coins, Shoutout, username-privacy warning | Core first, growth features later |
| Nav | Explore, Interests, Sell, Updates, Me | Home, Search, Sell, Chats, Profile (add Updates/Interests in Phase 3–4) |

## 3. Middle East specifics

- **Arabic-first**: RTL (`I18nManager`), Arabic + English UI and listing text, Arabic search normalization (hamza, tashkeel, ta marbuta).
- **Markets / currencies**: UAE (AED), KSA (SAR), Qatar (QAR), Kuwait (KWD, 3 decimals), Bahrain (BHD), Oman (OMR); Egypt and Jordan later.
- **Payments**: cash on meet-up first; later cards, Apple Pay, mada, STC Pay, Tabby/Tamara via a regional gateway (Tap, HyperPay, Checkout.com, PayTabs).
- **Delivery**: Aramex, SMSA, J&T, Naqel, Careem Box; meet-up is the default.
- **Trust and safety**: phone OTP (SMS/WhatsApp), ID verification above a threshold, per-country prohibited items (alcohol, pork, weapons…), scam warnings, Buyer Protection.
- **Compliance**: UAE/KSA PDPL, consumer protection, VAT for business sellers, App Store UGC rules (report/block/EULA).

## 4. Tech stack

| Layer | Choice |
|---|---|
| App | Expo SDK 57, Expo Router, TypeScript, NativeWind (existing) |
| Backend | Supabase (Postgres + RLS, Auth, Storage, Realtime) — the `services/` layer is already designed to swap to it |
| Search | Postgres full-text first; Meilisearch/Typesense when Arabic relevance needs it |
| Chat | Supabase Realtime + Expo push notifications |
| AI | Claude API (vision) via a backend function for photo-to-listing, translation, moderation |
| Media | Supabase Storage / CDN, `expo-image`, blurhash |
| Payments | Regional gateway (Phase 6) |
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
- [x] Money as integer minor units, country and currency table (AED, SAR, QAR, KWD, BHD, OMR)
- [ ] Load DM Sans and an Arabic font (currently the system font)
- [ ] **You:** confirm app name, bundle id / package, icons
- [ ] **You:** Apple Developer + Google Play Console accounts; `eas init`; `EXPO_TOKEN` secret; first manual store uploads
- [ ] **You:** create the Supabase project and run the migration
- [ ] First tag release (`v0.1.0`) to validate both pipelines

### Phase 1 — Accounts and profiles
- [x] Phone OTP sign-in with country picker and local number validation (Arabic digits accepted)
- [x] Google and Apple sign-in through Supabase OAuth (needs provider setup, see README)
- [x] Guests can browse; sign-in is a screen, not a wall; route guards for sign-in and onboarding
- [x] Onboarding: display name, country, city, interests. Names that look like an email or phone number are rejected in the app and in the database
- [x] Profile: view, edit (photo, name, bio, city), sign out
- [x] Settings: language, country and currency, notifications preference
- [x] Demo mode so everything works before a backend exists
- [ ] **You:** enable Phone / Google / Apple providers in Supabase and add redirect URLs
- [ ] Test on real iOS and Android devices (verified so far: lint, typecheck, web build, and a browser run of sign-in, onboarding, persistence and Arabic/RTL)
- [ ] Notification permission and push token registration (moves to Phase 4 with chat)
- [ ] Account deletion (required by the App Store; add before submission)

### Phase 2 — Listings
- [x] Category tree (8 top-level, 20 second-level) with per-category fields (cars: year, mileage, transmission; phones: brand, storage; property: bedrooms, area…)
- [x] Create-listing form: up to 10 photos from the library or camera, reorder with arrows, remove, title, category and type, condition, description templates (Casual / Bullet points / Short / Write my own), For sale or Free, fixed price, pre-order, deal methods (meet-up, delivery, cash on delivery), city
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
- [x] Likes with a Favourites screen; follow sellers; share through the system sheet and WhatsApp
- [x] Postgres schema for all of this: trigram index on the normalised text, like counter trigger, follows, saved searches (migration `0002`)
- [ ] **Nearby is a city match, not distance.** Real distance and the approximate map pin need coordinates on listings
- [ ] Interests tab (Favourites covers likes; an interests-based tab can come with push notifications)
- [ ] Paging (the feed loads the newest 40 to 80), typo-tolerant search, search-result ranking
- [ ] Share links use a placeholder domain (`APP_URL` in `constants/theme.ts`); set the real domain and deep-link handling before launch

### Phase 4 — Chat and offers
- [x] One conversation per buyer and listing, opened from Chat or Make an offer on a listing; photos and text; quick replies ("Is this still available?")
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

### Phase 5 — Trust and safety
- [ ] Ratings and reviews, seller badges, phone and ID verification
- [ ] Automated moderation (text + image), report queue, admin console
- [ ] Scam tips in listing and chat flows

### Phase 6 — Transactions
- [ ] Cart, checkout, Buyer Protection (escrow), My sales / orders
- [ ] Payment gateway (cards, Apple Pay, mada, STC Pay, BNPL) and Cash on Delivery
- [ ] Courier integration, balance and IBAN payouts, insights (views, likes, earnings)

### Phase 7 — Growth and monetization
- [ ] Promote/bump, promotions and coupons, Shoutout
- [ ] Certified listings, trade-in and sell-to-platform
- [ ] Plus subscription, business accounts, referrals, gamification, camera search, live shows (stretch)

### Phase 8 — Launch
- [ ] Performance, accessibility, security review
- [ ] Store listings (ar/en), screenshots, privacy policy, terms, data-safety forms
- [ ] Beta then soft launch in one country (UAE or KSA), then expand

### Phase 9 — Post-launch
- [ ] Analytics, A/B tests, ranking, more countries/carriers, admin tooling

## 6. Risks

| Risk | Mitigation |
|---|---|
| Cold start | Launch one country/city, seed sellers |
| Scams and prohibited items | Verification, moderation, Buyer Protection |
| Arabic search quality | Normalization, dedicated engine when needed |
| App Store UGC review | Report/block, moderation, EULA before submission |
| Per-country payment/regulatory differences | One country at a time |
| Expo SDK churn (SDK 57) | Use `npx expo install`, check versioned docs, `expo-doctor` in CI later |

## 7. Release pipeline (GitHub Actions + EAS)

- `ci.yml` — on PRs and `main`: `npx expo lint` and `npx tsc --noEmit`.
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
1. Create the Supabase project, run migrations `0001` to `0003`, enable the Phone provider (and Google / Apple), fill `.env`.
2. Deploy `suggest-listing` and `send-push`, add the notifications webhook, and try Sell and Chat on two real phones.
3. `eas init`, add `EXPO_TOKEN`, confirm the bundle id, then tag `v0.1.0` to test both release pipelines.
4. Phase 5: ratings and reviews, seller verification, moderation.
