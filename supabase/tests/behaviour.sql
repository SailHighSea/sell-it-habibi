\set ON_ERROR_STOP 0
\pset tuples_only on
select 'normalize:' || public.normalize_search('أَحمد إيفون مدرسة على ١٥ كــتاب');
insert into auth.users (id, phone, phone_confirmed_at) values ('00000000-0000-0000-0000-000000000001','+971500000001', now()), ('00000000-0000-0000-0000-000000000002','+971500000002', null);
select 'profiles auto-created: ' || count(*) || ', verified: ' || count(*) filter (where phone_verified) from public.profiles;
update auth.users set phone_confirmed_at = now() where id = '00000000-0000-0000-0000-000000000002';
select 'phone_verified synced on confirm: ' || phone_verified from public.profiles where id = '00000000-0000-0000-0000-000000000002';

-- as user 1
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
update public.profiles set display_name = 'a@b.com' where id = auth.uid();
update public.profiles set display_name = 'Yousef A.', onboarded = true where id = auth.uid();
select 'name saved: ' || display_name from public.profiles where id = auth.uid();
update public.profiles set phone_verified = false where id = auth.uid();
update public.profiles set display_name = 'Hacked' where id = '00000000-0000-0000-0000-000000000002';
select 'other profile untouched: ' || coalesce(display_name,'(null)') from public.profiles where id = '00000000-0000-0000-0000-000000000002';

insert into public.listings (id, seller_id, title, description, price_minor, currency, category_slug, country, city)
 values ('10000000-0000-0000-0000-000000000001', auth.uid(), 'آيفون 13 Pro', 'بحالة ممتازة', 150000, 'AED', 'smartphones', 'AE', 'Dubai');
select 'search_text: ' || search_text from public.listings;
insert into public.listings (seller_id, title, price_minor, currency, category_slug, country, type) values (auth.uid(), 'Free thing', 500, 'AED', 'toys', 'AE', 'free');
insert into public.listings (seller_id, title, price_minor, currency, category_slug, country, deal_methods) values (auth.uid(), 'Bad deal', 100, 'AED', 'toys', 'AE', '{teleport}');
insert into public.listings (seller_id, title, price_minor, currency, category_slug, country) values ('00000000-0000-0000-0000-000000000002', 'Impersonated', 100, 'AED', 'toys', 'AE');
update public.listings set favorite_count = 999;
update public.listings set bumped_at = now();
reset role;
update public.listings set bumped_at = now() - interval '2 hours';

-- bump is allowed again after an hour, and the server (not the client) sets the time
alter table public.listings disable trigger listings_limit_bump;
update public.listings set bumped_at = now() - interval '2 hours';
alter table public.listings enable trigger listings_limit_bump;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
update public.listings set bumped_at = now() - interval '5 days';   -- a forged value is replaced by the server clock
select 'forged bump replaced by server time: ' || (bumped_at > now() - interval '1 minute') from public.listings;
reset role;

-- as user 2
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
update public.listings set title = 'Stolen' where id = '10000000-0000-0000-0000-000000000001';
select 'title after foreign update: ' || title from public.listings;
insert into public.favorites (user_id, listing_id) values (auth.uid(), '10000000-0000-0000-0000-000000000001');
select 'favorite_count after like: ' || favorite_count from public.listings;
insert into public.favorites (user_id, listing_id) values ('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001');
delete from public.favorites where user_id = auth.uid();
select 'favorite_count after unlike: ' || favorite_count from public.listings;
insert into public.follows values (auth.uid(), auth.uid());
insert into public.follows values (auth.uid(), '00000000-0000-0000-0000-000000000001');
select 'follows visible to follower: ' || count(*) from public.follows;
insert into public.saved_searches (user_id, name, query) values (auth.uid(), 'phones', '{"text":"iphone"}');
reset role;

-- visibility
update public.listings set status = 'inactive';
set role anon; select 'anon sees inactive listing: ' || count(*) from public.listings; reset role;
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
select 'owner sees own inactive listing: ' || count(*) from public.listings;
select 'user1 sees user2 follows: ' || count(*) from public.follows;
select 'user1 sees user2 saved searches: ' || count(*) from public.saved_searches;
reset role;
-- Arabic search uses the normalised column
update public.listings set status = 'active';
select 'arabic ilike finds hamza-folded: ' || count(*) from public.listings where search_text ilike '%' || public.normalize_search('ايفون') || '%';
select 'arabic ilike finds ta-marbuta-folded: ' || count(*) from public.listings where search_text ilike '%' || public.normalize_search('ممتازة') || '%';
