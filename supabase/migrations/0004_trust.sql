-- Phase 5: reviews and ratings, "sold to", staff roles, moderation queue, bans, removed listings.

-- ---------- profiles: role, ban, rating ----------
alter table public.profiles
  add column role text not null default 'user' check (role in ('user', 'moderator', 'admin')),
  add column banned_at timestamptz,
  add column rating_avg numeric(3, 2),
  add column rating_count integer not null default 0;
-- Roles, bans and ratings are never writable by clients (the column grants from 0001 don't include them),
-- and profile rows come only from the signup trigger, so nobody can insert themselves as an admin.
revoke insert on public.profiles from authenticated;

create function public.is_staff() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('moderator', 'admin'))
$$;
create function public.is_banned() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and banned_at is not null)
$$;
revoke execute on function public.is_staff(), public.is_banned() from public, anon;
grant execute on function public.is_staff(), public.is_banned() to authenticated;

-- ---------- listings: removed status, sold to ----------
alter table public.listings drop constraint listings_status_check;
alter table public.listings add constraint listings_status_check check (status in ('active', 'inactive', 'sold', 'removed'));
alter table public.listings
  add column sold_to uuid references public.profiles (id) on delete set null,
  add column sold_at timestamptz;

drop policy "active listings are public, owners see all of theirs" on public.listings;
create policy "active listings are public, owners and staff see more" on public.listings for select
  using (status = 'active' or seller_id = auth.uid() or public.is_staff());

drop policy "sellers create their own listings" on public.listings;
create policy "sellers create their own listings" on public.listings for insert to authenticated
  with check (seller_id = auth.uid() and not public.is_banned());

-- A seller can't bring back a listing a moderator removed.
create function public.keep_removed() returns trigger language plpgsql as $$
begin
  if old.status = 'removed' and new.status <> 'removed' and not public.is_staff() then
    raise exception 'removed_by_moderator' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger listings_keep_removed before update of status on public.listings
  for each row execute function public.keep_removed();

-- ---------- banned people can't message ----------
create function public.block_banned_sender() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.sender_id is not null and exists (select 1 from public.profiles where id = new.sender_id and banned_at is not null) then
    raise exception 'banned' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger messages_block_banned before insert on public.messages for each row execute function public.block_banned_sender();

create function public.block_banned_buyer() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.profiles where id = new.buyer_id and banned_at is not null) then
    raise exception 'banned' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger threads_block_banned before insert on public.threads for each row execute function public.block_banned_buyer();

-- ---------- notifications: new kinds ----------
alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('message', 'offer', 'offer_accepted', 'offer_declined', 'meetup', 'review_request', 'review', 'moderation'));

-- ---------- reviews ----------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid unique references public.listings (id) on delete set null,   -- one review per sold item
  listing_title text not null,                                                   -- kept if the listing is later deleted
  seller_id uuid not null references public.profiles (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 500),
  created_at timestamptz not null default now(),
  check (seller_id <> reviewer_id)
);
create index reviews_seller_idx on public.reviews (seller_id, created_at desc);
alter table public.reviews enable row level security;
create policy "reviews are public" on public.reviews for select using (true);
-- Reviews are written only by submit_review().

create function public.refresh_rating() returns trigger language plpgsql security definer set search_path = public as $$
declare sid uuid := coalesce(new.seller_id, old.seller_id);
begin
  update public.profiles p set
    rating_avg = (select round(avg(rating)::numeric, 2) from public.reviews where seller_id = sid),
    rating_count = (select count(*) from public.reviews where seller_id = sid)
  where p.id = sid;
  return null;
end $$;
create trigger reviews_refresh_rating after insert or delete on public.reviews for each row execute function public.refresh_rating();

-- ---------- mark sold / review ----------
-- Marks the item sold. With a buyer (someone the seller chatted with about this item) that person is asked for a review.
create function public.mark_sold(p_listing uuid, p_buyer uuid default null) returns void language plpgsql security definer set search_path = public as $$
declare l public.listings;
begin
  select * into l from public.listings where id = p_listing and seller_id = auth.uid() for update;
  if not found then raise exception 'listing_not_found'; end if;
  if l.status not in ('active', 'inactive') then raise exception 'not_sellable'; end if;
  if p_buyer is not null then
    if not exists (select 1 from public.threads where listing_id = l.id and buyer_id = p_buyer) then raise exception 'not_a_buyer'; end if;
  end if;
  update public.listings set status = 'sold', sold_to = p_buyer, sold_at = now() where id = l.id;
  if p_buyer is not null then
    insert into public.notifications (user_id, kind, thread_id, listing_id, actor_id)
    select p_buyer, 'review_request', t.id, l.id, auth.uid() from public.threads t where t.listing_id = l.id and t.buyer_id = p_buyer;
  end if;
end $$;

create function public.submit_review(p_listing uuid, p_rating integer, p_comment text default null) returns uuid language plpgsql security definer set search_path = public as $$
declare l public.listings; rid uuid;
begin
  select * into l from public.listings where id = p_listing;
  if not found or l.sold_to is distinct from auth.uid() then raise exception 'not_your_purchase'; end if;
  if p_rating is null or p_rating not between 1 and 5 then raise exception 'invalid_rating'; end if;
  if exists (select 1 from public.reviews where listing_id = l.id) then raise exception 'already_reviewed'; end if;
  insert into public.reviews (listing_id, listing_title, seller_id, reviewer_id, rating, comment)
  values (l.id, l.title, l.seller_id, auth.uid(), p_rating, nullif(btrim(coalesce(p_comment, '')), ''))
  returning id into rid;
  insert into public.notifications (user_id, kind, listing_id, actor_id) values (l.seller_id, 'review', l.id, auth.uid());
  return rid;
end $$;

revoke execute on function public.mark_sold(uuid, uuid), public.submit_review(uuid, integer, text) from public, anon;
grant execute on function public.mark_sold(uuid, uuid), public.submit_review(uuid, integer, text) to authenticated;

-- ---------- moderation queue ----------
alter table public.reports alter column reporter_id drop not null;       -- automatic flags have no reporter
alter table public.reports
  add column source text not null default 'user' check (source in ('user', 'auto')),
  add column status text not null default 'open' check (status in ('open', 'actioned', 'dismissed')),
  add column handled_by uuid references public.profiles (id) on delete set null,
  add column handled_at timestamptz,
  add column resolution text check (resolution in ('dismiss', 'warn', 'remove_listing', 'ban_user')),
  add column staff_note text check (staff_note is null or char_length(staff_note) <= 500);
create index reports_queue_idx on public.reports (status, created_at desc);
create unique index reports_one_open_auto_per_listing on public.reports (listing_id) where source = 'auto' and status = 'open';

drop policy "users file reports" on public.reports;
create policy "users file reports" on public.reports for insert to authenticated
  with check (reporter_id = auth.uid() and source = 'user' and status = 'open' and not public.is_banned());
create policy "staff read reports" on public.reports for select to authenticated using (public.is_staff());
-- Reports change only through resolve_report().

-- One action closes a report. Everyone affected is told, so removals and bans are never silent.
create function public.resolve_report(p_report uuid, p_action text, p_note text default null) returns void language plpgsql security definer set search_path = public as $$
declare r public.reports; note text := nullif(left(btrim(coalesce(p_note, '')), 500), '');
begin
  if not public.is_staff() then raise exception 'not_staff'; end if;
  if p_action not in ('dismiss', 'warn', 'remove_listing', 'ban_user') then raise exception 'invalid_action'; end if;
  select * into r from public.reports where id = p_report for update;
  if not found then raise exception 'report_not_found'; end if;
  if r.status <> 'open' then raise exception 'report_closed'; end if;

  if p_action = 'remove_listing' then
    if r.listing_id is null then raise exception 'no_listing'; end if;
    update public.listings set status = 'removed' where id = r.listing_id;
    insert into public.notifications (user_id, kind, listing_id, body)
    select seller_id, 'moderation', id, coalesce(note, 'Removed by moderators') from public.listings where id = r.listing_id;
  elsif p_action = 'warn' then
    if r.target_user_id is null then raise exception 'no_target'; end if;
    insert into public.notifications (user_id, kind, listing_id, body) values (r.target_user_id, 'moderation', r.listing_id, coalesce(note, 'Warning from moderators'));
  elsif p_action = 'ban_user' then
    if r.target_user_id is null then raise exception 'no_target'; end if;
    if r.target_user_id = auth.uid() then raise exception 'cannot_ban_self'; end if;
    update public.profiles set banned_at = now() where id = r.target_user_id and role = 'user';
    update public.listings set status = 'removed' where seller_id = r.target_user_id and status in ('active', 'inactive');
  end if;

  update public.reports set
    status = case when p_action = 'dismiss' then 'dismissed' else 'actioned' end,
    handled_by = auth.uid(), handled_at = now(), resolution = p_action, staff_note = note
  where id = r.id;
end $$;

create function public.unban_user(p_user uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'not_staff'; end if;
  update public.profiles set banned_at = null where id = p_user;
end $$;

revoke execute on function public.resolve_report(uuid, text, text), public.unban_user(uuid) from public, anon;
grant execute on function public.resolve_report(uuid, text, text), public.unban_user(uuid) to authenticated;
