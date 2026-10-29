-- Phase 3: listings get an approximate pin so "Nearby" can be a real distance, not a city-name match.
-- The pin is the centre of the chosen area nudged by up to about 400 m (done in the app), never an exact address.

alter table public.listings
  add column lat double precision check (lat between -90 and 90),
  add column lng double precision check (lng between -180 and 180),
  add constraint listings_pin_pair check ((lat is null) = (lng is null));

-- The app narrows radius searches to a latitude/longitude box first, then applies the exact circle itself.
create index listings_pin_idx on public.listings (country, lat, lng) where status = 'active';

-- Sellers set the pin when they post or change the city (column grants are explicit on listings).
grant update (lat, lng) on public.listings to authenticated;
