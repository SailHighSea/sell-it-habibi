-- Run after migrations 0001 to 0005.
\pset tuples_only on
set client_encoding = 'UTF8';
insert into auth.users (id, phone, phone_confirmed_at) values
  ('00000000-0000-0000-0000-0000000000a1', '+971500000031', now()),   -- seller
  ('00000000-0000-0000-0000-0000000000b2', '+971500000032', now()),   -- signed-in reporter
  ('00000000-0000-0000-0000-0000000000d4', '+971500000033', now());   -- moderator
update public.profiles set role = 'moderator' where id = '00000000-0000-0000-0000-0000000000d4';
insert into public.listings (id, seller_id, title, price_minor, currency, category_slug, country) values
  ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'Sofa', 100, 'AED', 'sofas-majlis', 'AE'),
  ('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000a1', 'Lamp', 100, 'AED', 'tables-chairs', 'AE'),
  ('50000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000a1', 'Desk', 100, 'AED', 'tables-chairs', 'AE'),
  ('50000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-0000000000a1', 'Chair', 100, 'AED', 'tables-chairs', 'AE'),
  ('50000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-0000000000a1', 'Bed', 100, 'AED', 'beds-bedroom', 'AE'),
  ('50000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-0000000000a1', 'Rug', 100, 'AED', 'tables-chairs', 'AE');

-- a guest reports a listing
set role anon;
select public.report_content('50000000-0000-0000-0000-000000000001', null, 'scam', '  asks for a deposit  ', 'device-aaaaaaaa');
select public.report_content('50000000-0000-0000-0000-000000000001', null, 'scam', null, 'device-aaaaaaaa');        -- same listing again: refused
select public.report_content('50000000-0000-0000-0000-000000000001', null, 'scam', null, 'device-bbbbbbbb');        -- a different device is a different reporter
select public.report_content('50000000-0000-0000-0000-000000000001', null, 'nonsense', null, 'device-aaaaaaaa');    -- bad reason
select public.report_content(null, null, 'spam', null, 'device-aaaaaaaa');                                          -- nothing to report
select public.report_content('50000000-0000-0000-0000-000000000001', null, 'spam', null, null);                     -- no device id
select public.report_content('50000000-0000-0000-0000-00000000ffff', null, 'spam', null, 'device-aaaaaaaa');        -- unknown listing
-- no direct writes, and guests can't read anything
insert into public.reports (reason, details) values ('spam', 'direct');
select 'guest can read reports: ' || count(*) from public.reports;
-- the rate limit: 5 per hour per device (device-aaaaaaaa already used 1, plus listings 2 to 5)
select public.report_content('50000000-0000-0000-0000-000000000002', null, 'spam', null, 'device-aaaaaaaa');
select public.report_content('50000000-0000-0000-0000-000000000003', null, 'spam', null, 'device-aaaaaaaa');
select public.report_content('50000000-0000-0000-0000-000000000004', null, 'spam', null, 'device-aaaaaaaa');
select public.report_content('50000000-0000-0000-0000-000000000005', null, 'spam', null, 'device-aaaaaaaa');
select public.report_content('50000000-0000-0000-0000-000000000006', null, 'spam', null, 'device-aaaaaaaa');        -- 6th: rate limited
reset role;
select 'stored guest reports: ' || count(*) || ' (reporter null: ' || count(*) filter (where reporter_id is null) || ', keyed: ' || count(*) filter (where guest_key is not null) || ')' from public.reports;
select 'details trimmed: [' || details || ']' from public.reports where details is not null limit 1;
select 'target taken from the listing: ' || count(*) from public.reports where target_user_id = '00000000-0000-0000-0000-0000000000a1';
select 'device id is not stored in clear: ' || count(*) from public.reports where guest_key like '%device%';

-- signed in
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b2';
select public.report_content('50000000-0000-0000-0000-000000000001', null, 'scam', 'also me', null);
select public.report_content('50000000-0000-0000-0000-000000000001', null, 'scam', 'again', null);                 -- already reported
select public.report_content(null, '00000000-0000-0000-0000-0000000000b2', 'abusive', null, null);                 -- reporting yourself
select public.report_content(null, '00000000-0000-0000-0000-0000000000a1', 'abusive', 'rude in chat', null);       -- a person, no listing
reset role;
select 'signed-in reports stored: ' || count(*) || ' (one on the listing, one on the person)' from public.reports where reporter_id = '00000000-0000-0000-0000-0000000000b2';
-- a seller reporting their own listing
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
select public.report_content('50000000-0000-0000-0000-000000000001', null, 'spam', null, null);
reset role;

-- a removed listing can't be reported (it is gone for everyone)
update public.listings set status = 'removed' where id = '50000000-0000-0000-0000-000000000006';
set role anon;
select public.report_content('50000000-0000-0000-0000-000000000006', null, 'spam', null, 'device-cccccccc');
reset role;

-- staff see guest reports in the queue, with no reporter
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d4';
select 'staff see guest reports: ' || count(*) from public.reports where reporter_id is null and status = 'open';
select public.resolve_report(id, 'dismiss', null) from public.reports where reporter_id is null limit 1;
reset role;
select 'a guest report can be resolved: ' || count(*) from public.reports where reporter_id is null and status = 'dismissed';
-- a banned person can't report
update public.profiles set banned_at = now() where id = '00000000-0000-0000-0000-0000000000b2';
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b2';
select public.report_content('50000000-0000-0000-0000-000000000002', null, 'spam', null, null);
reset role;
