-- Run after migrations 0001 to 0006.
\pset tuples_only on
insert into auth.users (id, phone, phone_confirmed_at) values ('00000000-0000-0000-0000-0000000000a9', '+971500000091', now());
insert into public.listings (id, seller_id, title, price_minor, currency, category_slug, country, city, lat, lng) values
  ('60000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a9', 'Near',  100, 'AED', 'tables-chairs', 'AE', 'Dubai Marina', 25.0810, 55.1410),
  ('60000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000a9', 'Far',   100, 'AED', 'tables-chairs', 'AE', 'Abu Dhabi',   24.4540, 54.3770),
  ('60000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000a9', 'NoPin', 100, 'AED', 'tables-chairs', 'AE', 'Sharjah', null, null);
select 'box around Dubai Marina finds: ' || string_agg(title, ',' order by title) from public.listings
  where country = 'AE' and lat between 24.99 and 25.17 and lng between 55.05 and 55.23;
select 'pins without coordinates: ' || count(*) from public.listings where lat is null;
-- a pin needs both halves (expected ERROR)
insert into public.listings (seller_id, title, price_minor, currency, category_slug, country, lat) values ('00000000-0000-0000-0000-0000000000a9', 'Half', 100, 'AED', 'tables-chairs', 'AE', 25.0);
-- out-of-range latitude (expected ERROR)
insert into public.listings (seller_id, title, price_minor, currency, category_slug, country, lat, lng) values ('00000000-0000-0000-0000-0000000000a9', 'Off', 100, 'AED', 'tables-chairs', 'AE', 95, 10);
-- the owner can move the pin; another person cannot
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a9', false);
update public.listings set lat = 25.0820, lng = 55.1420 where id = '60000000-0000-0000-0000-000000000001';
select 'owner moved pin: ' || lat from public.listings where id = '60000000-0000-0000-0000-000000000001';
-- a signed-out visitor can browse listings (migration 0007 fixes is_staff being refused for anon)
set role anon;
select 'anon can read listings: ' || count(*) from public.listings;
reset role;
-- nearby_stats (migration 0007): only the pinned, in-range, active listing counts
reset role;
update public.profiles set phone_verified = true where id = '00000000-0000-0000-0000-0000000000a9';
insert into public.listings (id, seller_id, title, price_minor, currency, category_slug, country, city, lat, lng, type) values
  ('60000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-0000000000a9', 'Free box', 0, 'AED', 'tables-chairs', 'AE', 'Dubai Marina', 25.0830, 55.1400, 'free');
set role anon;
select 'stats 10 km: ' || new_today || '/' || free_items || '/' || verified_sellers || '/' || total from public.nearby_stats('AE', 25.0805, 55.1403, 10);
select 'stats 500 km total: ' || total from public.nearby_stats('AE', 25.0805, 55.1403, 500);
-- Sri Lanka (migration 0008): rupee listings in Colombo are accepted, an unknown country is still refused (expected ERROR)
reset role;
insert into public.listings (id, seller_id, title, price_minor, currency, category_slug, country, city, lat, lng) values
  ('60000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-0000000000a9', 'Colombo sofa', 8500000, 'LKR', 'sofas-majlis', 'LK', 'Colombo', 6.93, 79.86);
select 'LK listing stored: ' || currency from public.listings where id = '60000000-0000-0000-0000-000000000010';
insert into public.listings (seller_id, title, price_minor, currency, category_slug, country) values ('00000000-0000-0000-0000-0000000000a9', 'Nowhere', 100, 'LKR', 'sofas-majlis', 'XX');
