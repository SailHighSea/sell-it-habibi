-- Home's "near you" card (new today, free items, verified sellers) in one cheap call instead of fetching hundreds of listings.
-- Distance is the haversine formula on the listing's approximate pin; listings without a pin are not counted.

create function public.nearby_stats(p_country text, p_lat double precision, p_lng double precision, p_radius_km double precision)
returns table (new_today bigint, free_items bigint, verified_sellers bigint, total bigint)
language sql stable security invoker set search_path = public as $$
  with near as (
    select l.type, l.created_at, l.seller_id
    from public.listings l
    where l.status = 'active' and l.country = p_country and l.lat is not null
      and l.lat between p_lat - degrees(p_radius_km / 6371.0) and p_lat + degrees(p_radius_km / 6371.0)
      and 2 * 6371.0 * asin(least(1, sqrt(
            power(sin(radians(l.lat - p_lat) / 2), 2)
            + cos(radians(p_lat)) * cos(radians(l.lat)) * power(sin(radians(l.lng - p_lng) / 2), 2)))) <= p_radius_km
  )
  select count(*) filter (where created_at > now() - interval '24 hours'),
         count(*) filter (where type = 'free'),
         (select count(distinct n.seller_id) from near n join public.profiles p on p.id = n.seller_id where p.phone_verified),
         count(*)
  from near;
$$;
grant execute on function public.nearby_stats(text, double precision, double precision, double precision) to anon, authenticated;

-- Fix: the "listing visibility" policy (0004) calls is_staff(), and 0004 had revoked it from anon, so a signed-out visitor's
-- listing query failed with "permission denied for function is_staff". It returns false when nobody is signed in, so it is safe to allow.
grant execute on function public.is_staff() to anon;
