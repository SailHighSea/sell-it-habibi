# Database checks

`behaviour.sql` exercises the migrations: triggers, constraints, column permissions and row-level security.
It prints one line per check. Every `ERROR:` line it prints is an attempt that is supposed to be refused.

Run it against a scratch UTF-8 Postgres 16 database, never a real project:

```bash
createdb --encoding=UTF8 --template=template0 sih_test
psql -d sih_test -f supabase/tests/stub-supabase.sql         # minimal stand-in for Supabase's auth and storage schemas
psql -d sih_test -c "alter default privileges in schema public grant all on tables to authenticated, anon;"
psql -d sih_test -f supabase/migrations/0001_init.sql -f supabase/migrations/0002_listings_discovery.sql -f supabase/migrations/0003_chat.sql -f supabase/migrations/0004_trust.sql -f supabase/migrations/0005_guest_reports.sql
psql -d sih_test -f supabase/tests/behaviour.sql
psql -d sih_test -f supabase/tests/behaviour-chat.sql
psql -d sih_test -f supabase/tests/behaviour-trust.sql   # needs migration 0004 as well
psql -d sih_test -f supabase/tests/behaviour-report.sql  # needs migrations 0004 and 0005
```

Expected refusals: an email-like display name, editing `phone_verified`, impersonating a seller, a free item with a price,
an unknown deal method, editing `favorite_count`, bumping twice within an hour, liking as someone else, following yourself.
Expected results: `anon sees inactive listing: 0`, `user1 sees user2 follows: 0`, `favorite_count after like: 1` then `0` after unlike.

`behaviour-chat.sql` covers chat: one thread per buyer and listing, no messaging your own listing, no spoofed senders,
whitespace-only messages refused, outsiders can't read or write, offers (a new offer replaces the pending one, fixed-price
rule, own offers can't be answered by yourself, closed offers can't be answered again, counter-offers), unread counts,
mute stops notifications, blocking stops messages and offers, reports, and push tokens are private.

`behaviour-trust.sql` covers reviews and ratings (only the buyer, one per item, rating math, a review outlives its listing),
marking sold (only the seller, only to someone who chatted), staff roles that can't be self-assigned, the moderation queue
(only staff read it, actions notify people, closed reports stay closed), removed listings staying removed, and bans.

`behaviour-report.sql` covers reporting without an account: guests can report a listing, repeats and the 5-an-hour limit are refused, the device id is stored only as a hash, the target comes from the listing, direct writes are closed, guests can't read reports, staff can resolve them, and banned people can't report.
