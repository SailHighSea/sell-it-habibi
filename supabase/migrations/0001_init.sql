-- Sell It Habibi schema v1: profiles, categories, listings, images, favorites.
-- Money is stored as integer minor units (price_minor). RLS is on for every table.

create extension if not exists pgcrypto;

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or (char_length(display_name) between 2 and 30 and display_name !~ '@')),
  bio text check (bio is null or char_length(bio) <= 300),
  city text check (city is null or char_length(city) <= 60),
  country text not null default 'AE' check (country in ('AE','SA','QA','KW','BH','OM')),
  avatar_url text,
  interests text[] not null default '{}',
  phone_verified boolean not null default false,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are readable by everyone" on public.profiles for select using (true);
create policy "users insert their own profile" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "users update their own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Clients may only change these columns; phone_verified is set by the trigger below.
revoke update on public.profiles from authenticated;
grant update (display_name, bio, city, country, avatar_url, interests, onboarded) on public.profiles to authenticated;

create function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- A profile row is created for every new auth user; display_name is never taken from email or phone.
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone_verified) values (new.id, new.phone_confirmed_at is not null)
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.sync_phone_verified() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set phone_verified = (new.phone_confirmed_at is not null) where id = new.id;
  return new;
end $$;

create trigger on_auth_user_phone_confirmed after update of phone_confirmed_at on auth.users
  for each row execute function public.sync_phone_verified();

-- ---------- categories ----------
create table public.categories (
  slug text primary key,
  parent_slug text references public.categories (slug),
  name_en text not null,
  name_ar text not null,
  sort integer not null default 0
);
alter table public.categories enable row level security;
create policy "categories are readable by everyone" on public.categories for select using (true);

insert into public.categories (slug, name_en, name_ar, sort) values
  ('cars', 'Cars', 'سيارات', 1),
  ('phones', 'Phones', 'هواتف', 2),
  ('furniture', 'Furniture', 'أثاث', 3),
  ('fashion', 'Fashion', 'أزياء', 4),
  ('electronics', 'Electronics', 'إلكترونيات', 5),
  ('property', 'Property', 'عقارات', 6),
  ('kids', 'Kids', 'أطفال', 7),
  ('sports', 'Sports', 'رياضة', 8);

-- ---------- listings ----------
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  description text check (description is null or char_length(description) <= 4000),
  price_minor bigint not null check (price_minor >= 0),
  currency text not null check (currency in ('AED','SAR','QAR','KWD','BHD','OMR')),
  condition text not null default 'used' check (condition in ('new','like_new','used')),
  category_slug text not null references public.categories (slug),
  country text not null check (country in ('AE','SA','QA','KW','BH','OM')),
  city text,
  status text not null default 'active' check (status in ('active','inactive','sold')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index listings_feed_idx on public.listings (country, status, created_at desc);
create index listings_seller_idx on public.listings (seller_id, status);
create index listings_category_idx on public.listings (category_slug, status);

alter table public.listings enable row level security;
create policy "active listings are public, owners see all of theirs" on public.listings for select
  using (status = 'active' or seller_id = auth.uid());
create policy "sellers create their own listings" on public.listings for insert to authenticated with check (seller_id = auth.uid());
create policy "sellers update their own listings" on public.listings for update to authenticated using (seller_id = auth.uid()) with check (seller_id = auth.uid());
create policy "sellers delete their own listings" on public.listings for delete to authenticated using (seller_id = auth.uid());

create trigger listings_touch before update on public.listings
  for each row execute function public.touch_updated_at();

create table public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  path text not null,
  position integer not null default 0
);
create index listing_images_listing_idx on public.listing_images (listing_id, position);
alter table public.listing_images enable row level security;
create policy "images follow listing visibility" on public.listing_images for select
  using (exists (select 1 from public.listings l where l.id = listing_id and (l.status = 'active' or l.seller_id = auth.uid())));
create policy "sellers manage images of their listings" on public.listing_images for all to authenticated
  using (exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid()))
  with check (exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid()));

-- ---------- favorites ----------
create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);
alter table public.favorites enable row level security;
create policy "users read their favorites" on public.favorites for select to authenticated using (user_id = auth.uid());
create policy "users add favorites" on public.favorites for insert to authenticated with check (user_id = auth.uid());
create policy "users remove favorites" on public.favorites for delete to authenticated using (user_id = auth.uid());

-- ---------- storage ----------
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true), ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

-- Files live under "<user id>/…" so the first folder name is the owner.
create policy "public read avatars" on storage.objects for select using (bucket_id = 'avatars');
create policy "users write own avatar" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users replace own avatar" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "public read listing images" on storage.objects for select using (bucket_id = 'listing-images');
create policy "users write own listing images" on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users delete own listing images" on storage.objects for delete to authenticated
  using (bucket_id = 'listing-images' and (storage.foldername(name))[1] = auth.uid()::text);
