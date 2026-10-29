# Sell It Habibi — Project Plan

Peer-to-peer marketplace for second-hand and new items in the Middle East, in the style of Carousell (Asian market). Android, iOS and Web from one Expo codebase.

## 1. Status at a glance

Legend: **Built** = code written and checked here (lint, types, tests, a browser run in demo mode, and the database migrations run on a real Postgres). **Needs your accounts** = built, but it only runs for real once you set up the service. Nothing has been run on a physical phone yet.

| Phase | Built | Still open |
|---|---|---|
| 0. Foundation | App, tabs, Arabic/RTL, theme, Supabase schema and client, EAS config, CI and release workflows | DM Sans / Arabic font; **your** accounts, `eas init`, Supabase project, first `v0.1.0` release |
| 1. Accounts and profiles | Phone sign-in, Google/Apple sign-in, onboarding, profile, settings, demo mode | Turn on providers in Supabase; test on real devices; account deletion |
| 2. Listings | Category tree, create/edit form, photos, AI autofill, manage listings, drafts | Drag-to-reorder photos, bulk "Post all", filters on Manage listings; AI function and photo upload untested for real |
| 3. Discovery | Feed tabs, search (Arabic-aware, filters, saved), detail page, favourites, follow, share | Distance-based Nearby and map pin, paging, typo-tolerant search, real share domain |
| 4. Chat and offers | Chat, offers, meet-ups, Chats and Updates tabs, mute/block/report, push code, floating pill bottom bar | Push end to end (phone, credentials, webhook), realtime on a real project, live location |
| 5. Trust and safety | Reviews and ratings, mark-sold-to-a-buyer, report a listing, moderation screen (queue, warn, remove, ban), prohibited-items list with warnings and blocks, scam tips, automatic checks function, database rules (migration `0004`) | Legal review of the prohibited list, ID verification (deferred), real-project test of the moderation function; guests can't report yet |
| 6. Transactions | **Later, not in the current scope** (all deals happen outside the app) | Kept below for the future |
| 7. Growth and monetization | Free bump (from Phase 2) | The rest; anything paid waits for Phase 6 |
| 8. Launch | Nothing yet | Everything below |
| 9. Post-launch | Nothing yet | Everything below |

### Product rules (decided)

1. **No account to browse.** Home, search, listing pages, seller pages, sharing, language and country settings need no sign-in. Likes, follows and saved searches also work without an account: they are kept on the phone and moved into the account when the person signs in later.
2. **An account is needed only to chat and to sell.** That means Chat and Make an offer on a listing, the Chats and Updates tabs, creating and managing listings, and the profile.
3. **Deals happen outside the app.** The app connects buyers and sellers: listings, chat, offers and meet-up proposals are tools for agreeing. Payment, handover and delivery are arranged by the two people themselves (meet-up, cash, bank transfer, their own courier). Because of that there is no cart, checkout, escrow or "Buyer Protection" for now. The deal methods on a listing (meet-up, delivery, cash on delivery) are information for buyers; the app does not take payment or ship anything.

**What the app does today (demo mode, no backend needed):** browse, search, like, follow and save searches without an account; sign in with a demo code to chat or sell; set up a profile, list an item from a photo, manage your listings, like and follow, chat with a demo seller, make and counter offers, propose meet-ups, and use everything in English or Arabic.

**What needs you:** Apple and Google developer accounts, a Supabase project (run migrations `0001` to `0004`), an Anthropic API key for the photo autofill, and EAS credentials for pushes. The steps are in `README.md` and section 7.

**Checks that run in CI:** lint, typecheck and `npm test` (about 90 checks of the pure logic). `supabase/tests/` holds database checks you can run on a scratch Postgres.

Files added along the way: `eas.json`, `app.json` ids (`com.sellithabibi.app` is a **placeholder**; ids can't be changed after publishing), `.github/workflows/ci.yml` and `release.yml`, `supabase/migrations/0001` to `0004`, `supabase/functions/suggest-listing`, `send-push` and `moderate-listing`, `design/mockups.html`.

## 2. Reference: what Carousell does (from screenshots)

| Area | Carousell | Our equivalent |
|---|---|---|
| Explore | Search + camera search, cart, chat; category tabs; shortcuts (Likes, Cars, Trade-in); feed tabs Top picks / Nearby / Free Items / Certified / Following; cards with age, price, condition, seller, Buyer Protection badge, heart | Same layout; localized categories; RTL. No Buyer Protection badge (deals are outside the app) |
| Sell flow | Create a listing, or sell directly to the platform (mobile, luxury, fashion, cars); photo upload then **AI extraction of details**; "Fill in manually"; multiple listings, "Post all" | Photo-first listing with AI autofill, bulk posting |
| Listing form | Category tree, title, condition, type, description templates (Casual / Simple / Bullet points / Write my own), For Sale / For Free, price validation, Fixed price, Pre-order, deal method (meet-up, official delivery) | Same, plus Cash on Delivery, Arabic/English description |
| Manage listings | Search, filters, Active / Inactive / Others, likes count, View insights, Promote | Same |
| Me | Rating and reviews, Selling/Buying tabs, My listings, My sales, lifetime earnings, Balance, Selling preferences, Live shows, Plus, Buddies, Promotions, Biz, Coins, Shoutout, username-privacy warning | Core first, growth features later |
| Nav | Explore, Interests, Sell, Updates, Me | Floating pill: Home, Search, Chats, Updates, Me, with a floating "+ Sell" button. Favourites replace the Interests tab for now |

## 3. Middle East specifics

- **Arabic-first**: RTL (`I18nManager`), Arabic + English UI and listing text, Arabic search normalization (hamza, tashkeel, ta marbuta).
- **Markets / currencies**: UAE (AED), KSA (SAR), Qatar (QAR), Kuwait (KWD, 3 decimals), Bahrain (BHD), Oman (OMR); Egypt and Jordan later.
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
- [x] Money as integer minor units, country and currency table (AED, SAR, QAR, KWD, BHD, OMR)
- [ ] Load DM Sans and an Arabic font (currently the system font)
- [ ] **You:** confirm app name, bundle id / package, icons
- [ ] **You:** Apple Developer + Google Play Console accounts; `eas init`; `EXPO_TOKEN` secret; first manual store uploads
- [ ] **You:** create the Supabase project and run migrations `0001` to `0004` in order
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
- [ ] **Nearby is a city match, not distance.** Real distance and the approximate map pin need coordinates on listings
- [ ] Interests tab (Favourites covers likes; an interests-based tab can come with push notifications)
- [ ] Paging (the feed loads the newest 40 to 80), typo-tolerant search, search-result ranking
- [ ] Share links use a placeholder domain (`APP_URL` in `constants/theme.ts`); set the real domain and deep-link handling before launch

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
- [x] Report a listing from its page (needs sign-in, to limit abuse); owners see "Removed by moderators" on removed listings, which can only be deleted
- [x] Per-country prohibited-items list (`supabase/functions/_shared/prohibited.json`, one file shared by the app and the server): "block" items (weapons, drugs, fake documents, adult content) stop the listing, "warn" items (alcohol, pork in some countries, tobacco and vapes, medicine, replicas, live animals) show a notice
- [x] Scam tips on every listing page you don't own
- [x] Demo mode: you are an admin, so the moderation screen can be tried; reports you file appear in its queue

**Server function**
- [x] `supabase/functions/moderate-listing`: checks new and edited listings against the prohibited-items list and, if `ANTHROPIC_API_KEY` is set, with Claude (text and the first two photos), and adds anything suspicious to the queue. It never removes a listing by itself; a person decides. Needs a Database Webhook (see README)
- [ ] Not run against a real project or the real Claude API yet

**Still open**
- [ ] **Legal review of the prohibited-items list for each country.** It is a starter list written by an engineer
- [ ] ID verification and seller badges beyond the phone check (needs a paid provider such as Onfido or Sumsub; deferred)
- [ ] Reporting without an account. Today reporting a listing or a person needs sign-in, which differs from "account only for chat and sell"; tell me if guests should be able to report
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
- [ ] Performance, accessibility, security review
- [ ] Store listings (ar/en), screenshots, privacy policy, terms, data-safety forms. No in-app purchases of goods, which keeps store review simpler
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

To try the app on your phone: push to the `release` branch, then open the newest pre-release under the repo's Releases and install the `.apk`. The EAS workflow below is for store builds and needs your Expo, Apple and Google accounts.

- `ci.yml` — on PRs and `main`: `npx expo lint`, `npx tsc --noEmit` and `npm test`.
- `android-apk.yml` — **test APK, no accounts needed.** Runs when the `release` branch is pushed (or by hand): builds an installable Android APK on GitHub, attaches it to a GitHub pre-release you can download on your phone. Debug-signed, 64-bit phones only, demo mode unless Supabase variables are set. Not for the Play Store.
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
1. Create the Supabase project, run migrations `0001` to `0004`, enable the Phone provider (and Google / Apple), fill `.env`.
2. Deploy `suggest-listing`, `send-push` and `moderate-listing`, add the two database webhooks (notifications, listings), make yourself an admin (README), and try Sell, Chat, review and moderation on two real phones.
3. Have the prohibited-items list reviewed for each country, and decide about guest reporting and ID verification.
4. `eas init`, add `EXPO_TOKEN`, confirm the bundle id, then tag `v0.1.0` to test both release pipelines.
5. Next build step: Phase 7 (free growth features) or Phase 8 (launch preparation: accessibility, security review, account deletion, store listings). Phase 6 (transactions) stays parked.
