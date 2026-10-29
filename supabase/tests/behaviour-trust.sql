-- Run after migrations 0001 to 0004 are applied.
\pset tuples_only on
set client_encoding = 'UTF8';
insert into auth.users (id, phone, phone_confirmed_at) values
  ('00000000-0000-0000-0000-0000000000a1', '+971500000021', now()),   -- seller
  ('00000000-0000-0000-0000-0000000000b2', '+971500000022', now()),   -- buyer
  ('00000000-0000-0000-0000-0000000000c3', '+971500000023', now()),   -- other buyer
  ('00000000-0000-0000-0000-0000000000d4', '+971500000024', now());   -- moderator
update public.profiles set role = 'moderator' where id = '00000000-0000-0000-0000-0000000000d4';
insert into public.listings (id, seller_id, title, price_minor, currency, category_slug, country)
values ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'Camera', 100000, 'AED', 'gaming', 'AE'),
       ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000a1', 'Sketchy listing', 5000, 'AED', 'toys', 'AE'),
       ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000a1', 'Lamp', 2000, 'AED', 'tables-chairs', 'AE');
-- a separate conversation, used later to check that a banned seller can't message
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c3';
select public.start_thread('30000000-0000-0000-0000-000000000003') as lamp_thread \gset
reset role;

-- nobody can make themselves staff, or insert a profile
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b2';
update public.profiles set role = 'admin' where id = auth.uid();
update public.profiles set rating_avg = 5, rating_count = 99, banned_at = null where id = auth.uid();
insert into public.profiles (id, role) values (gen_random_uuid(), 'admin');
select 'is_staff for normal user: ' || public.is_staff();
-- buyer chats about the camera
select public.start_thread('30000000-0000-0000-0000-000000000001') is not null as ok \gset
reset role;
select 'role still user: ' || role from public.profiles where id = '00000000-0000-0000-0000-0000000000b2';

-- mark sold: only the seller, only to someone who chatted
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b2';
select public.mark_sold('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b2');
reset role;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
select public.mark_sold('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000c3');
select public.mark_sold('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b2');
select 'sold to buyer: ' || (sold_to = '00000000-0000-0000-0000-0000000000b2') || ', status ' || status from public.listings where id = '30000000-0000-0000-0000-000000000001';
select public.mark_sold('30000000-0000-0000-0000-000000000001', null);
reset role;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b2';
select 'buyer still sees the sold item: ' || count(*) from public.listings where id = '30000000-0000-0000-0000-000000000001';
reset role;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c3';
select 'other buyer sees the sold item (had no chat): ' || count(*) from public.listings where id = '30000000-0000-0000-0000-000000000001';
reset role;
select 'buyer asked for a review: ' || count(*) from public.notifications where user_id = '00000000-0000-0000-0000-0000000000b2' and kind = 'review_request';

-- reviews
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c3';
select public.submit_review('30000000-0000-0000-0000-000000000001', 5, 'not my purchase');
reset role;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b2';
select public.submit_review('30000000-0000-0000-0000-000000000001', 6, null);
select public.submit_review('30000000-0000-0000-0000-000000000001', 4, '  Good seller  ') is not null as reviewed \gset
select public.submit_review('30000000-0000-0000-0000-000000000001', 5, 'again');
insert into public.reviews (listing_title, seller_id, reviewer_id, rating) values ('x', '00000000-0000-0000-0000-0000000000a1', auth.uid(), 5);
select 'comment trimmed: [' || comment || ']' from public.reviews;
reset role;
select 'seller rating: ' || rating_avg || ' from ' || rating_count from public.profiles where id = '00000000-0000-0000-0000-0000000000a1';
select 'seller told of review: ' || count(*) from public.notifications where user_id = '00000000-0000-0000-0000-0000000000a1' and kind = 'review';
-- a seller who deletes the listing keeps the review
delete from public.listings where id = '30000000-0000-0000-0000-000000000001';
select 'review survives listing delete: ' || count(*) || ', title ' || min(listing_title) from public.reviews;
select 'rating unchanged: ' || rating_count from public.profiles where id = '00000000-0000-0000-0000-0000000000a1';
set role anon; select 'anyone can read reviews: ' || count(*) from public.reviews; reset role;

-- reports
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b2';
select public.report_content('30000000-0000-0000-0000-000000000002', null, 'scam', 'asks for payment first', null);
insert into public.reports (reporter_id, target_user_id, reason, source) values (auth.uid(), '00000000-0000-0000-0000-0000000000a1', 'scam', 'auto');   -- refused: no direct writes
select 'reporter cannot read reports: ' || count(*) from public.reports;
select public.resolve_report(id, 'dismiss', null) from (select id from public.reports limit 1) x;
reset role;
select id as rid from public.reports limit 1 \gset
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d4';
select 'staff sees queue: ' || count(*) from public.reports where status = 'open';
select 'staff sees removed/inactive listings too: ' || (select count(*) from public.listings);
select public.resolve_report(:'rid', 'remove_listing', 'Looks like a scam');
select 'listing removed: ' || status from public.listings where id = '30000000-0000-0000-0000-000000000002';
select 'report closed: ' || status || ' by moderator ' || (handled_by is not null) || ', ' || resolution from public.reports where id = :'rid';
select public.resolve_report(:'rid', 'dismiss', null);
reset role;
select 'seller told of removal: ' || body from public.notifications where user_id = '00000000-0000-0000-0000-0000000000a1' and kind = 'moderation';

-- seller cannot bring the listing back; staff can
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
update public.listings set status = 'active' where id = '30000000-0000-0000-0000-000000000002';
select 'still removed for seller: ' || status from public.listings where id = '30000000-0000-0000-0000-000000000002';
reset role;

-- a removed listing disappears for people who only chatted about it, but not for its seller
insert into public.reports (id, reporter_id, target_user_id, listing_id, reason) values ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000a1', '30000000-0000-0000-0000-000000000003', 'prohibited');
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c3';
select 'chat partner sees the lamp before removal: ' || count(*) from public.listings where id = '30000000-0000-0000-0000-000000000003';
reset role;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d4';
select public.resolve_report('40000000-0000-0000-0000-000000000002', 'remove_listing', null);
reset role;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c3';
select 'chat partner sees the lamp after removal: ' || count(*) from public.listings where id = '30000000-0000-0000-0000-000000000003';
reset role;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
select 'seller still sees their removed lamp: ' || count(*) from public.listings where id = '30000000-0000-0000-0000-000000000003';
reset role;

-- ban
insert into public.reports (id, reporter_id, target_user_id, listing_id, reason) values ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000a1', null, 'abusive');
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b2';
select public.resolve_report('40000000-0000-0000-0000-000000000001', 'ban_user', null);
reset role;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d4';
select public.resolve_report('40000000-0000-0000-0000-000000000001', 'ban_user', 'Repeated abuse');
reset role;
select 'seller banned: ' || (banned_at is not null) from public.profiles where id = '00000000-0000-0000-0000-0000000000a1';
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
insert into public.listings (seller_id, title, price_minor, currency, category_slug, country) values (auth.uid(), 'New after ban', 100, 'AED', 'toys', 'AE');
reset role;
select 'banned seller cannot post: ' || count(*) from public.listings where title = 'New after ban';
-- a banned person can't chat (the seller of the lamp, banned above)
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
insert into public.messages (thread_id, sender_id, kind, body) values (:'lamp_thread', auth.uid(), 'text', 'hello');
reset role;
select 'banned person cannot message: ' || count(*) from public.messages where body = 'hello';
-- staff can lift it; a moderator cannot be banned through a report
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000d4';
select public.unban_user('00000000-0000-0000-0000-0000000000a1');
reset role;
select 'unbanned: ' || (banned_at is null) from public.profiles where id = '00000000-0000-0000-0000-0000000000a1';
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b2';
select public.unban_user('00000000-0000-0000-0000-0000000000a1');
reset role;
