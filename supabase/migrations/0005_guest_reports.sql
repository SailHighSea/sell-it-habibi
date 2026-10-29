-- Guests (no account) can report a listing or a person. All reports now go through report_content(), which limits abuse:
-- at most 5 reports an hour per reporter (the account, or for guests the device plus network address), and one open
-- report per listing per reporter. Guest reports have no reporter_id and are marked in the moderation queue.

alter table public.reports add column guest_key text;
create index reports_guest_key_idx on public.reports (guest_key, created_at desc) where guest_key is not null;

-- Direct inserts are closed; report_content() is the only way in.
drop policy "users file reports" on public.reports;

create function public.report_content(
  p_listing uuid, p_target uuid, p_reason text, p_details text default null, p_device text default null,
  p_thread uuid default null
) returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  me uuid := auth.uid();
  target uuid := p_target;
  headers json := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json;
  ip text := nullif(btrim(split_part(coalesce(headers ->> 'x-forwarded-for', ''), ',', 1)), '');
  gkey text;
  recent integer;
  details text := nullif(left(btrim(coalesce(p_details, '')), 1000), '');
begin
  if p_reason not in ('scam', 'spam', 'abusive', 'prohibited', 'other') then raise exception 'invalid_reason'; end if;
  if p_listing is null and p_target is null then raise exception 'nothing_to_report'; end if;
  if me is not null and exists (select 1 from public.profiles where id = me and banned_at is not null) then raise exception 'banned'; end if;

  -- A listing report is about that listing's seller, whatever the client said.
  if p_listing is not null then
    select seller_id into target from public.listings where id = p_listing and status <> 'removed';
    if not found then raise exception 'listing_not_found'; end if;
  elsif not exists (select 1 from public.profiles where id = p_target) then
    raise exception 'target_not_found';
  end if;
  if target = me then raise exception 'own_content'; end if;

  if me is null then
    if p_device is null or char_length(p_device) < 8 then raise exception 'device_required'; end if;
    gkey := encode(digest(coalesce(ip, '') || ':' || left(p_device, 64), 'sha256'), 'hex');
  end if;

  select count(*) into recent from public.reports
  where created_at > now() - interval '1 hour' and source = 'user'
    and ((me is not null and reporter_id = me) or (gkey is not null and guest_key = gkey));
  if recent >= 5 then raise exception 'rate_limited'; end if;

  if p_listing is not null and exists (
    select 1 from public.reports where listing_id = p_listing and source = 'user' and status = 'open'
      and ((me is not null and reporter_id = me) or (gkey is not null and guest_key = gkey))
  ) then raise exception 'already_reported'; end if;

  insert into public.reports (reporter_id, guest_key, target_user_id, listing_id, thread_id, reason, details)
  values (me, gkey, target, p_listing, case when me is not null then p_thread end, p_reason, details);
end $$;

revoke execute on function public.report_content(uuid, uuid, text, text, text, uuid) from public;
grant execute on function public.report_content(uuid, uuid, text, text, text, uuid) to anon, authenticated;
