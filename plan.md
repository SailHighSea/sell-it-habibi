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

### Phase 0 — Foundation (partly done)
- [x] Expo app, tabs, responsive nav, mock feed
- [x] CI workflow, EAS config, release workflow
- [ ] Confirm app name, bundle id / package, brand, icons
- [ ] Apple Developer + Google Play Console accounts; EAS project (`eas init`); first manual store uploads
- [ ] Localization (ar/en) + RTL, theme tokens, dev/staging/prod envs
- [ ] Supabase project, schema v1, RLS, typed client replacing `services/listings.ts` mock
- [ ] First tag release (`v0.1.0`) to validate both pipelines

### Phase 1 — Accounts and profiles
- [ ] Phone OTP login, Apple / Google sign-in, country selection
- [ ] Profile (avatar, display name — never derived from email, bio, location), settings (language, country, notifications)
- [ ] Onboarding and interests

### Phase 2 — Listings
- [ ] Category tree with per-category fields
- [ ] Create-listing flow: multi-photo (`expo-image-picker`), reorder, title, category, condition, type, description templates, price, For Sale / For Free, Fixed price, Pre-order, deal method
- [ ] **AI autofill from photo**, manual fallback
- [ ] Manage listings: Active / Inactive / Sold, search, filters, edit, deactivate, delete, bump
- [ ] Drafts, bulk "Post all"

### Phase 3 — Discovery
- [ ] Feed tabs: For you, Top picks, Nearby, Free, Following; category tabs
- [ ] Listing detail, gallery, seller card
- [ ] Search with Arabic-aware matching, filters (price, condition, category, distance), sort, saved searches
- [ ] Likes, Interests tab, WhatsApp/link sharing, location with approximate map pin

### Phase 4 — Chat and offers
- [ ] 1:1 chat per listing with images, push notifications
- [ ] Make offer / counter / accept, quick replies
- [ ] Meet-up scheduling and location share
- [ ] Updates tab, block / report / mute

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
1. Confirm launch country, final bundle id, and Supabase as the backend.
2. Finish Phase 0 (Arabic/RTL, Supabase client, EAS init) and ship `v0.1.0`.
