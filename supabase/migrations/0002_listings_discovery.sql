-- Phase 2 and 3: richer listings, category tree, Arabic-aware search, favourites count, follows, saved searches.

create extension if not exists pg_trgm;

-- ---------- categories (second level) ----------
insert into public.categories (slug, parent_slug, name_en, name_ar, sort) values
  ('used-cars', 'cars', 'Used cars', 'سيارات مستعملة', 1),
  ('car-parts', 'cars', 'Parts and accessories', 'قطع وإكسسوارات', 2),
  ('smartphones', 'phones', 'Smartphones', 'هواتف ذكية', 1),
  ('phone-accessories', 'phones', 'Phone accessories', 'إكسسوارات الهواتف', 2),
  ('tablets', 'phones', 'Tablets', 'أجهزة لوحية', 3),
  ('sofas-majlis', 'furniture', 'Sofas and majlis', 'كنب ومجالس', 1),
  ('beds-bedroom', 'furniture', 'Beds and bedroom', 'غرف نوم', 2),
  ('tables-chairs', 'furniture', 'Tables and chairs', 'طاولات وكراسي', 3),
  ('womens-fashion', 'fashion', 'Women''s fashion', 'أزياء نسائية', 1),
  ('mens-fashion', 'fashion', 'Men''s fashion', 'أزياء رجالية', 2),
  ('abayas-modest', 'fashion', 'Abayas and modest wear', 'عبايات وأزياء محتشمة', 3),
  ('computers-laptops', 'electronics', 'Computers and laptops', 'حواسيب ولابتوب', 1),
  ('gaming', 'electronics', 'Gaming', 'ألعاب فيديو', 2),
  ('tv-audio', 'electronics', 'TV and audio', 'تلفزيونات وصوتيات', 3),
  ('property-rent', 'property', 'For rent', 'للإيجار', 1),
  ('property-sale', 'property', 'For sale', 'للبيع', 2),
  ('baby-gear', 'kids', 'Baby gear', 'مستلزمات الأطفال', 1),
  ('toys', 'kids', 'Toys', 'ألعاب', 2),
  ('bikes', 'sports', 'Bikes', 'دراجات', 1),
  ('fitness', 'sports', 'Fitness', 'لياقة بدنية', 2)
on conflict (slug) do nothing;

-- ---------- search normalisation (mirrors lib/arabic.ts) ----------
-- Removes diacritics and tatweel, folds alef forms, alef maqsura and ta marbuta, maps Arabic-Indic digits to Latin, lowercases.
create function public.normalize_search(t text) returns text language sql immutable as $$
  select lower(
    translate(
      regexp_replace(coalesce(t, ''), '[ً-ٰٟـ]', '', 'g'),
      'أإآٱىة٠١٢٣٤٥٦٧٨٩',
      'اااايه0123456789'
    )
  )
$$;

-- ---------- listings: new columns ----------
alter table public.listings
  add column type text not null default 'sale' check (type in ('sale','free')),
  add column attributes jsonb not null default '{}'::jsonb,
  add column fixed_price boolean not null default false,
  add column pre_order boolean not null default false,
  add column deal_methods text[] not null default '{meetup}' check (deal_methods <@ array['meetup','delivery','cod']),
  add column image_paths text[] not null default '{}' check (cardinality(image_paths) <= 10),
  add column bumped_at timestamptz not null default now(),
  add column favorite_count integer not null default 0,
  add column search_text text not null default '',
  add constraint listings_free_has_no_price check (type <> 'free' or price_minor = 0);

-- Photos are stored as storage paths on the listing itself.
drop table public.listing_images;

create function public.listings_set_search_text() returns trigger language plpgsql as $$
begin
  new.search_text = public.normalize_search(new.title || ' ' || coalesce(new.description, ''));
  return new;
end $$;

create trigger listings_search_text before insert or update of title, description on public.listings
  for each row execute function public.listings_set_search_text();

create index listings_search_trgm_idx on public.listings using gin (search_text gin_trgm_ops);
create index listings_bumped_idx on public.listings (country, status, bumped_at desc);
create index listings_popular_idx on public.listings (country, status, favorite_count desc);

-- ---------- favourites count ----------
create function public.bump_favorite_count() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.listings set favorite_count = favorite_count + 1 where id = new.listing_id;
  else
    update public.listings set favorite_count = greatest(favorite_count - 1, 0) where id = old.listing_id;
  end if;
  return null;
end $$;

create trigger favorites_count after insert or delete on public.favorites
  for each row execute function public.bump_favorite_count();

-- Clients must not edit counters or timestamps directly.
revoke update on public.listings from authenticated;
grant update (title, description, price_minor, currency, condition, category_slug, country, city, status, type, attributes,
              fixed_price, pre_order, deal_methods, image_paths, bumped_at) on public.listings to authenticated;

-- A seller may bump at most once an hour.
create function public.limit_bump() returns trigger language plpgsql as $$
begin
  if new.bumped_at is distinct from old.bumped_at then
    if old.bumped_at > now() - interval '1 hour' then
      raise exception 'bump_too_soon' using errcode = 'P0001';
    end if;
    new.bumped_at = now();
  end if;
  return new;
end $$;

create trigger listings_limit_bump before update of bumped_at on public.listings
  for each row execute function public.limit_bump();

-- ---------- follows ----------
create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
alter table public.follows enable row level security;
create policy "users read who they follow" on public.follows for select to authenticated using (follower_id = auth.uid());
create policy "users follow others" on public.follows for insert to authenticated with check (follower_id = auth.uid());
create policy "users unfollow" on public.follows for delete to authenticated using (follower_id = auth.uid());

-- ---------- saved searches ----------
create table public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  query jsonb not null,
  created_at timestamptz not null default now()
);
create index saved_searches_user_idx on public.saved_searches (user_id, created_at desc);
alter table public.saved_searches enable row level security;
create policy "users manage their saved searches" on public.saved_searches for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
