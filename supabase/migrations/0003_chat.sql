-- Phase 4: chat, offers, meet-ups, notifications, blocking, reporting, push tokens.
-- Writes that need rules (starting a thread, offers, answering offers, muting, reading) go through functions.

-- ---------- blocks ----------
create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
alter table public.blocks enable row level security;
create policy "users manage their own blocks" on public.blocks for all to authenticated
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- True when either person has blocked the other. Security definer so it can see the other person's blocks,
-- but it only answers for the caller's own conversations (a signed-in user can't probe other people's blocks).
create function public.is_blocked_between(a uuid, b uuid) returns boolean language sql stable security definer set search_path = public as $$
  select (auth.uid() is null or auth.uid() in (a, b))
     and exists (select 1 from public.blocks where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a))
$$;
revoke execute on function public.is_blocked_between(uuid, uuid) from public, anon;
grant execute on function public.is_blocked_between(uuid, uuid) to authenticated;

-- ---------- threads ----------
create table public.threads (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  last_kind text not null default 'text',
  last_preview text not null default '',
  buyer_read_at timestamptz not null default now(),
  seller_read_at timestamptz not null default now(),
  buyer_muted boolean not null default false,
  seller_muted boolean not null default false,
  unique (listing_id, buyer_id),
  check (buyer_id <> seller_id)
);
create index threads_buyer_idx on public.threads (buyer_id, last_message_at desc);
create index threads_seller_idx on public.threads (seller_id, last_message_at desc);

alter table public.threads enable row level security;
create policy "participants read their threads" on public.threads for select to authenticated
  using (auth.uid() in (buyer_id, seller_id));
-- No direct insert or update: see start_thread, mark_read and set_muted.

-- ---------- messages ----------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete set null,   -- null for system messages
  kind text not null check (kind in ('text', 'image', 'offer', 'meetup', 'system')),
  body text check (body is null or char_length(body) <= 2000),
  image_path text,
  meta jsonb not null default '{}'::jsonb,
  offer_status text check (offer_status in ('pending', 'accepted', 'declined', 'countered')),
  created_at timestamptz not null default now(),
  check (kind <> 'text' or char_length(btrim(coalesce(body, ''))) > 0),
  check (kind <> 'image' or image_path is not null),
  check ((kind = 'offer') = (offer_status is not null))
);
create index messages_thread_idx on public.messages (thread_id, created_at);

alter table public.messages enable row level security;
create policy "participants read messages" on public.messages for select to authenticated
  using (exists (select 1 from public.threads t where t.id = thread_id and auth.uid() in (t.buyer_id, t.seller_id)));
-- Clients may add text, photos and meet-up proposals themselves. Offers and system messages come from functions.
create policy "participants send text, photos and meet-ups" on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and kind in ('text', 'image', 'meetup')
    and exists (
      select 1 from public.threads t
      where t.id = thread_id and auth.uid() in (t.buyer_id, t.seller_id)
        and not public.is_blocked_between(t.buyer_id, t.seller_id)
    )
  );

-- ---------- notifications ----------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('message', 'offer', 'offer_accepted', 'offer_declined', 'meetup')),
  thread_id uuid references public.threads (id) on delete cascade,
  listing_id uuid references public.listings (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;
create policy "users read their notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "users mark their notifications read" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;

-- ---------- reports ----------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_user_id uuid references public.profiles (id) on delete set null,
  listing_id uuid references public.listings (id) on delete set null,
  thread_id uuid references public.threads (id) on delete set null,
  reason text not null check (reason in ('scam', 'spam', 'abusive', 'prohibited', 'other')),
  details text check (details is null or char_length(details) <= 1000),
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;
create policy "users file reports" on public.reports for insert to authenticated with check (reporter_id = auth.uid());
-- Nobody reads reports through the API; staff use the service role.

-- ---------- push tokens ----------
create table public.push_tokens (
  token text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null check (platform in ('ios', 'android')),
  updated_at timestamptz not null default now()
);
create index push_tokens_user_idx on public.push_tokens (user_id);
alter table public.push_tokens enable row level security;
create policy "users manage their push tokens" on public.push_tokens for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- message side effects ----------
create function public.on_message_inserted() returns trigger language plpgsql security definer set search_path = public as $$
declare
  t public.threads;
  recipient uuid;
  recipient_muted boolean;
begin
  select * into t from public.threads where id = new.thread_id;

  update public.threads set
    last_message_at = new.created_at,
    last_kind = new.kind,
    last_preview = case when new.kind = 'text' then left(new.body, 80) else '' end
  where id = new.thread_id;

  -- System messages notify from the function that created them. Everything else notifies the other person.
  if new.kind <> 'system' and new.sender_id is not null then
    recipient := case when new.sender_id = t.buyer_id then t.seller_id else t.buyer_id end;
    recipient_muted := case when recipient = t.buyer_id then t.buyer_muted else t.seller_muted end;
    if not recipient_muted and not public.is_blocked_between(t.buyer_id, t.seller_id) then
      insert into public.notifications (user_id, kind, thread_id, listing_id, actor_id, body)
      values (recipient, case new.kind when 'offer' then 'offer' when 'meetup' then 'meetup' else 'message' end,
              t.id, t.listing_id, new.sender_id, case when new.kind = 'text' then left(new.body, 120) else null end);
    end if;
  end if;
  return new;
end $$;

create trigger messages_after_insert after insert on public.messages
  for each row execute function public.on_message_inserted();

-- ---------- functions ----------
create function public.start_thread(p_listing uuid) returns uuid language plpgsql security definer set search_path = public as $$
declare
  l public.listings;
  tid uuid;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  select * into l from public.listings where id = p_listing and (status = 'active' or seller_id = auth.uid());
  if not found then raise exception 'listing_unavailable'; end if;
  if l.seller_id = auth.uid() then raise exception 'own_listing'; end if;
  if public.is_blocked_between(auth.uid(), l.seller_id) then raise exception 'blocked'; end if;

  insert into public.threads (listing_id, buyer_id, seller_id) values (l.id, auth.uid(), l.seller_id)
  on conflict (listing_id, buyer_id) do nothing;
  select id into tid from public.threads where listing_id = l.id and buyer_id = auth.uid();
  return tid;
end $$;

create function public.send_offer(p_thread uuid, p_amount bigint) returns uuid language plpgsql security definer set search_path = public as $$
declare
  t public.threads;
  l public.listings;
  mid uuid;
begin
  select * into t from public.threads where id = p_thread and auth.uid() in (buyer_id, seller_id);
  if not found then raise exception 'thread_not_found'; end if;
  if public.is_blocked_between(t.buyer_id, t.seller_id) then raise exception 'blocked'; end if;
  select * into l from public.listings where id = t.listing_id;
  if l.status <> 'active' then raise exception 'listing_unavailable'; end if;
  if l.type = 'free' then raise exception 'listing_free'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'invalid_amount'; end if;
  if l.fixed_price and p_amount <> l.price_minor then raise exception 'fixed_price'; end if;

  -- A new offer replaces any offer still waiting for an answer.
  update public.messages set offer_status = 'countered' where thread_id = t.id and kind = 'offer' and offer_status = 'pending';
  insert into public.messages (thread_id, sender_id, kind, meta, offer_status)
  values (t.id, auth.uid(), 'offer', jsonb_build_object('amount_minor', p_amount, 'currency', l.currency), 'pending')
  returning id into mid;
  return mid;
end $$;

create function public.respond_offer(p_message uuid, p_action text, p_counter bigint default null) returns uuid language plpgsql security definer set search_path = public as $$
declare
  m public.messages;
  t public.threads;
  l public.listings;
  sys uuid;
begin
  if p_action not in ('accept', 'decline', 'counter') then raise exception 'invalid_action'; end if;
  select * into m from public.messages where id = p_message and kind = 'offer' for update;
  if not found then raise exception 'offer_not_found'; end if;
  select * into t from public.threads where id = m.thread_id and auth.uid() in (buyer_id, seller_id);
  if not found then raise exception 'thread_not_found'; end if;
  if m.sender_id = auth.uid() then raise exception 'own_offer'; end if;
  if m.offer_status <> 'pending' then raise exception 'offer_closed'; end if;
  if public.is_blocked_between(t.buyer_id, t.seller_id) then raise exception 'blocked'; end if;
  select * into l from public.listings where id = t.listing_id;
  if l.status <> 'active' then raise exception 'listing_unavailable'; end if;

  if p_action = 'counter' then
    if l.fixed_price then raise exception 'fixed_price'; end if;
    return public.send_offer(t.id, p_counter);   -- also marks this offer as countered
  end if;

  update public.messages set offer_status = case p_action when 'accept' then 'accepted' else 'declined' end where id = m.id;
  insert into public.messages (thread_id, sender_id, kind, meta)
  values (t.id, null, 'system', jsonb_build_object('event', case p_action when 'accept' then 'offer_accepted' else 'offer_declined' end,
                                                   'amount_minor', (m.meta ->> 'amount_minor')::bigint, 'currency', m.meta ->> 'currency'))
  returning id into sys;
  insert into public.notifications (user_id, kind, thread_id, listing_id, actor_id)
  values (m.sender_id, case p_action when 'accept' then 'offer_accepted' else 'offer_declined' end, t.id, t.listing_id, auth.uid());
  return sys;
end $$;

create function public.mark_read(p_thread uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  update public.threads set
    buyer_read_at = case when buyer_id = auth.uid() then now() else buyer_read_at end,
    seller_read_at = case when seller_id = auth.uid() then now() else seller_read_at end
  where id = p_thread and auth.uid() in (buyer_id, seller_id);
  update public.notifications set read_at = now() where user_id = auth.uid() and thread_id = p_thread and read_at is null;
end $$;

create function public.set_muted(p_thread uuid, p_muted boolean) returns void language plpgsql security definer set search_path = public as $$
begin
  update public.threads set
    buyer_muted = case when buyer_id = auth.uid() then p_muted else buyer_muted end,
    seller_muted = case when seller_id = auth.uid() then p_muted else seller_muted end
  where id = p_thread and auth.uid() in (buyer_id, seller_id);
end $$;

-- Unread count per thread for the signed-in user. Runs with the caller's rights, so row-level security applies.
create function public.unread_counts() returns table (thread_id uuid, unread bigint) language sql stable security invoker as $$
  select t.id, count(m.id)
  from public.threads t
  left join public.messages m
    on m.thread_id = t.id and m.sender_id is distinct from auth.uid()
   and m.created_at > case when t.buyer_id = auth.uid() then t.buyer_read_at else t.seller_read_at end
  where auth.uid() in (t.buyer_id, t.seller_id)
  group by t.id
$$;

revoke execute on function public.start_thread(uuid), public.send_offer(uuid, bigint), public.respond_offer(uuid, text, bigint),
  public.mark_read(uuid), public.set_muted(uuid, boolean), public.unread_counts() from public, anon;
grant execute on function public.start_thread(uuid), public.send_offer(uuid, bigint), public.respond_offer(uuid, text, bigint),
  public.mark_read(uuid), public.set_muted(uuid, boolean), public.unread_counts() to authenticated;

-- ---------- storage: chat photos ----------
-- Private bucket; files live under "<thread id>/<file>" and only that thread's two people can read or write them.
insert into storage.buckets (id, name, public) values ('chat-images', 'chat-images', false) on conflict (id) do nothing;
create policy "participants read chat photos" on storage.objects for select to authenticated
  using (bucket_id = 'chat-images' and exists (
    select 1 from public.threads t where t.id::text = (storage.foldername(name))[1] and auth.uid() in (t.buyer_id, t.seller_id)));
create policy "participants add chat photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-images' and exists (
    select 1 from public.threads t where t.id::text = (storage.foldername(name))[1] and auth.uid() in (t.buyer_id, t.seller_id)));

-- ---------- realtime ----------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.messages, public.threads, public.notifications;
  end if;
end $$;
