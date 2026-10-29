-- Sri Lanka (LK, rupees). Countries and currencies are checked in three places; widen each.
alter table public.profiles drop constraint profiles_country_check;
alter table public.profiles add constraint profiles_country_check check (country in ('AE','SA','QA','KW','BH','OM','LK'));

alter table public.listings drop constraint listings_country_check;
alter table public.listings add constraint listings_country_check check (country in ('AE','SA','QA','KW','BH','OM','LK'));

alter table public.listings drop constraint listings_currency_check;
alter table public.listings add constraint listings_currency_check check (currency in ('AED','SAR','QAR','KWD','BHD','OMR','LKR'));
