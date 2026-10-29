-- Run after behaviour.sql's schema setup (migrations 0001 to 0003 applied). Uses fresh users so it can run on its own.
\pset tuples_only on
set client_encoding = 'UTF8';
insert into auth.users (id, phone, phone_confirmed_at) values
  ('00000000-0000-0000-0000-0000000000a1', '+971500000011', now()),   -- seller
  ('00000000-0000-0000-0000-0000000000b2', '+971500000012', now()),   -- buyer
  ('00000000-0000-0000-0000-0000000000c3', '+971500000013', now());   -- bystander
insert into public.listings (id, seller_id, title, price_minor, currency, category_slug, country, fixed_price)
values ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'Sofa', 100000, 'AED', 'sofas-majlis', 'AE', false),
       ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000a1', 'Fixed lamp', 5000, 'AED', 'tables-chairs', 'AE', true);

-- buyer starts a thread, once
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b2';
select 'thread started: ' || (public.start_thread('20000000-0000-0000-0000-000000000001') is not null);
select 'same thread reused: ' || (select count(distinct public.start_thread('20000000-0000-0000-0000-000000000001')) = 1);
select 'thread count: ' || count(*) from public.threads;
reset role;
select id as tid from public.threads limit 1 \gset
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
select 'seller cannot message own listing: ' || (select count(*) from public.threads) || ' thread(s) still';
select public.start_thread('20000000-0000-0000-0000-000000000001');
reset role;

-- text messages, notifications, preview
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b2';
insert into public.messages (thread_id, sender_id, kind, body) select id, auth.uid(), 'text', 'Is it still available?' from public.threads;
insert into public.messages (thread_id, sender_id, kind, body) select id, auth.uid(), 'text', '   ' from public.threads;
insert into public.messages (thread_id, sender_id, kind, body) select id, '00000000-0000-0000-0000-0000000000a1', 'text', 'spoofed' from public.threads;
insert into public.messages (thread_id, sender_id, kind, meta, offer_status) select id, auth.uid(), 'offer', '{"amount_minor":1}', 'pending' from public.threads;
insert into public.messages (thread_id, sender_id, kind, meta) select id, null, 'system', '{"event":"offer_accepted"}' from public.threads;
reset role;
select 'preview: ' || last_preview || ' / kind ' || last_kind from public.threads;
select 'seller notified: ' || count(*) from public.notifications where user_id = '00000000-0000-0000-0000-0000000000a1' and kind = 'message';
select 'buyer not notified of own message: ' || count(*) from public.notifications where user_id = '00000000-0000-0000-0000-0000000000b2';

-- bystander sees nothing
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c3';
select 'bystander sees threads: ' || count(*) from public.threads;
select 'bystander sees messages: ' || count(*) from public.messages;
insert into public.messages (thread_id, sender_id, kind, body) values (:'tid', auth.uid(), 'text', 'intruder');
reset role;
select 'bystander message rows: ' || count(*) from public.messages where body = 'intruder';

-- unread counts and mark_read
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
select 'seller unread: ' || unread from public.unread_counts();
select public.mark_read(id) from public.threads;
select 'seller unread after read: ' || unread from public.unread_counts();
select 'seller notification read: ' || (read_at is not null) from public.notifications where user_id = auth.uid() limit 1;
reset role;

-- offers
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b2';
select public.send_offer(id, 80000) as offer1 from public.threads \gset
select 'offer pending: ' || offer_status from public.messages where kind = 'offer';
select public.send_offer(id, 0) from public.threads;
select public.send_offer(id, 90000) as offer2 from public.threads \gset
select 'older offer replaced: ' || string_agg(offer_status, ',' order by created_at) from public.messages where kind = 'offer';
select 'offer id readable: ' || (:'offer2' is not null);
reset role;

-- offer rules
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b2';
select public.respond_offer(:'offer2', 'accept');         -- own offer: refused
reset role;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c3';
select public.respond_offer(:'offer2', 'accept');         -- bystander: refused
reset role;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
select public.respond_offer(:'offer2', 'counter', 95000) as counter_msg \gset
select 'counter flow: ' || string_agg(offer_status || ':' || (meta->>'amount_minor'), ' | ' order by created_at) from public.messages where kind = 'offer';
reset role;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b2';
select public.respond_offer(:'counter_msg', 'accept');
select 'accepted: ' || offer_status from public.messages where id = :'counter_msg';
select 'system message: ' || (meta->>'event') || ' ' || (meta->>'amount_minor') from public.messages where kind = 'system' order by created_at desc limit 1;
select public.respond_offer(:'counter_msg', 'decline');   -- already closed: refused
reset role;
select 'seller told of acceptance: ' || count(*) from public.notifications where user_id = '00000000-0000-0000-0000-0000000000a1' and kind = 'offer_accepted';

-- fixed price listing
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b2';
select public.start_thread('20000000-0000-0000-0000-000000000002') as t2 \gset
select public.send_offer(:'t2', 4000);                    -- below fixed price: refused
select 'fixed price offer at list price ok: ' || (public.send_offer(:'t2', 5000) is not null);
reset role;

-- mute stops notifications
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
select public.set_muted(id, true) from public.threads where listing_id = '20000000-0000-0000-0000-000000000001';
select 'muted flag set for me only: ' || (seller_muted and not buyer_muted) from public.threads where listing_id = '20000000-0000-0000-0000-000000000001';
reset role;
select count(*) as before_mute from public.notifications where user_id = '00000000-0000-0000-0000-0000000000a1' \gset
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b2';
insert into public.messages (thread_id, sender_id, kind, body) select id, auth.uid(), 'text', 'hello again' from public.threads where listing_id = '20000000-0000-0000-0000-000000000001';
reset role;
select 'no notification while muted: ' || ((select count(*) from public.notifications where user_id = '00000000-0000-0000-0000-0000000000a1') = :before_mute);

-- blocking
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
insert into public.blocks values (auth.uid(), '00000000-0000-0000-0000-0000000000b2');
reset role;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b2';
insert into public.messages (thread_id, sender_id, kind, body) select id, auth.uid(), 'text', 'blocked?' from public.threads where listing_id = '20000000-0000-0000-0000-000000000001';
select public.send_offer(id, 90000) from public.threads where listing_id = '20000000-0000-0000-0000-000000000001';
select 'blocked person cannot see who blocked: ' || count(*) from public.blocks;
reset role;
select 'blocked message not stored: ' || count(*) from public.messages where body = 'blocked?';

-- reports and push tokens
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000b2';
insert into public.reports (reporter_id, target_user_id, reason) values (auth.uid(), '00000000-0000-0000-0000-0000000000a1', 'scam');
insert into public.reports (reporter_id, target_user_id, reason) values ('00000000-0000-0000-0000-0000000000a1', auth.uid(), 'scam');
insert into public.reports (reporter_id, reason) values (auth.uid(), 'nonsense');
select 'reports readable by reporter: ' || count(*) from public.reports;
insert into public.push_tokens (token, user_id, platform) values ('ExponentPushToken[test]', auth.uid(), 'ios');
insert into public.push_tokens (token, user_id, platform) values ('ExponentPushToken[other]', '00000000-0000-0000-0000-0000000000a1', 'ios');
reset role;
select 'reports stored: ' || count(*) || ', tokens stored: ' || (select count(*) from public.push_tokens) from public.reports;
