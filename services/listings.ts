import { slugsUnder } from '@/constants/categories';
import type { CountryCode } from '@/constants/countries';
import { normalizeSearch, searchTokens } from '@/lib/arabic';
import { newId } from '@/lib/id';
import { shrinkPhoto } from '@/lib/photo';
import { boundingBox, approximatePin, findCity } from '@/lib/geo';
import { fuzzyIncludes } from '@/lib/fuzzy';
import { matchesQuery, runQuery, sortListings } from '@/lib/listing-query';
import type { Listing, ListingInput, ListingQuery, ListingStatus } from '@/lib/listing-types';
import { SELLER_COLUMNS, sellerFromRow, type SellerRow } from '@/lib/seller';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

import { loadDemoListings, mutateDemoListing, saveDemoListings } from './demo-store';
import { getProfile } from './profile';

export type { Listing } from '@/lib/listing-types';

const SELECT = `*, seller:profiles(${SELLER_COLUMNS})`;
const BUCKET = 'listing-images';

type Row = {
  id: string; seller_id: string; seller?: SellerRow | null; title: string; description: string | null; price_minor: number;
  currency: string; condition: Listing['condition']; type: Listing['type']; category_slug: string; country: CountryCode;
  city: string | null; lat: number | null; lng: number | null; status: ListingStatus; attributes: Listing['attributes']; fixed_price: boolean; pre_order: boolean;
  deal_methods: Listing['dealMethods']; image_paths: string[]; favorite_count: number; sold_to: string | null; created_at: string; bumped_at: string;
};


export function listingFromRow(r: Row): Listing {
  return {
    id: r.id, sellerId: r.seller_id, seller: r.seller ? sellerFromRow(r.seller) : undefined, title: r.title, description: r.description,
    priceMinor: Number(r.price_minor), currency: r.currency, condition: r.condition, type: r.type, categorySlug: r.category_slug,
    country: r.country, city: r.city, lat: r.lat ?? null, lng: r.lng ?? null, status: r.status, attributes: r.attributes ?? {}, fixedPrice: r.fixed_price,
    preOrder: r.pre_order, dealMethods: r.deal_methods, imagePaths: r.image_paths ?? [], favoriteCount: r.favorite_count, soldTo: r.sold_to ?? null,
    createdAt: r.created_at, bumpedAt: r.bumped_at,
  };
}

export { SELECT as LISTING_SELECT };

const hasScheme = (p: string) => /^[a-z][a-z0-9+.-]*:/i.test(p);

/** Public URL for a stored photo. Local picks and demo photos are already URIs. */
export function imageUrl(path: string): string {
  if (hasScheme(path) || !supabase) return path;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// Pictures for the sample listings in demo mode. They are bundled with the app and never used when a server is connected.
const DEMO_IMAGES: Record<string, number> = {
  'demo:iphone': require('../assets/demo/iphone.jpg'),
  'demo:phone-gold': require('../assets/demo/phone-gold.jpg'),
  'demo:landcruiser': require('../assets/demo/landcruiser.jpg'),
  'demo:sofa': require('../assets/demo/sofa.jpg'),
  'demo:ps5': require('../assets/demo/ps5.jpg'),
  'demo:abaya': require('../assets/demo/abaya.jpg'),
  'demo:bike': require('../assets/demo/bike.jpg'),
  'demo:desk': require('../assets/demo/desk.jpg'),
  'demo:macbook': require('../assets/demo/macbook.jpg'),
  'demo:boxes': require('../assets/demo/boxes.jpg'),
  'demo:apartment': require('../assets/demo/apartment.jpg'),
  'demo:cot': require('../assets/demo/cot.jpg'),
  'demo:tv': require('../assets/demo/tv.jpg'),
};

/** What to hand to an Image for a stored photo: a bundled demo picture, or the public URL. */
export function imageSource(path: string): number | { uri: string } {
  return DEMO_IMAGES[path] ?? { uri: imageUrl(path) };
}

/** Escape LIKE wildcards so user text can't widen a match. */
const likeEscape = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

/** Applies every filter except the text match, which differs between the first (exact) and second (typo-tolerant) pass. */
function baseRequest(q: ListingQuery) {
  let req = supabase!.from('listings').select(SELECT);
  if (q.country) req = req.eq('country', q.country);
  if (q.status !== 'all') req = req.eq('status', q.status ?? 'active');
  if (q.sellerId) req = req.eq('seller_id', q.sellerId);
  if (q.sellerIds) req = req.in('seller_id', q.sellerIds);
  if (q.category) req = req.in('category_slug', slugsUnder(q.category));
  if (q.freeOnly) req = req.eq('type', 'free');
  if (q.minPriceMinor !== undefined) req = req.gte('price_minor', q.minPriceMinor);
  if (q.maxPriceMinor !== undefined) req = req.lte('price_minor', q.maxPriceMinor);
  if (q.conditions?.length) req = req.in('condition', q.conditions);
  if (q.city) req = req.ilike('city', likeEscape(q.city.trim()));
  return req;
}

/** Radius search: the database narrows to a box around the point, then the exact circle and the order are applied here. */
async function searchNear(q: ListingQuery & { near: NonNullable<ListingQuery['near']> }): Promise<Listing[]> {
  const box = boundingBox(q.near, q.near.radiusKm);
  // Listings without a pin yet are matched by their city's centre, so fetch a little more than a page.
  const { data, error } = await baseRequest(q)
    .or(`and(lat.gte.${box.minLat},lat.lte.${box.maxLat},lng.gte.${box.minLng},lng.lte.${box.maxLng}),lat.is.null`)
    .order('bumped_at', { ascending: false })
    .limit(400);
  if (error) throw error;
  const rows = (data as unknown as Row[]).map(listingFromRow);
  const sort = q.sort ?? (q.text ? 'relevance' : 'nearest');
  const from = q.offset ?? 0;
  return sortListings(rows.filter((l) => matchesQuery(l, q)), sort, { near: q.near, text: q.text }).slice(from, from + (q.limit ?? 40));
}

export async function searchListings(q: ListingQuery): Promise<Listing[]> {
  if (!isSupabaseConfigured || !supabase) return runQuery(await loadDemoListings(), q);
  if (q.sellerIds && q.sellerIds.length === 0) return [];
  if (q.near) return searchNear({ ...q, near: q.near });

  const limit = q.limit ?? 40;
  const from = q.offset ?? 0;
  let req = baseRequest(q);
  if (q.text) for (const token of searchTokens(q.text)) req = req.ilike('search_text', `%${likeEscape(token)}%`);
  switch (q.sort) {
    case 'priceAsc': req = req.order('price_minor', { ascending: true }).order('bumped_at', { ascending: false }); break;
    case 'priceDesc': req = req.order('price_minor', { ascending: false }).order('bumped_at', { ascending: false }); break;
    case 'popular': req = req.order('favorite_count', { ascending: false }).order('bumped_at', { ascending: false }); break;
    default: req = req.order('bumped_at', { ascending: false });
  }
  const { data, error } = await req.range(from, from + limit - 1);
  if (error) throw error;
  let rows = (data as unknown as Row[]).map(listingFromRow);

  // Typo-tolerant second pass: when exact matching finds little on the first page, look through the newest 300 for near misses.
  if (q.text && from === 0 && rows.length < 5) {
    const { data: recent, error: err2 } = await baseRequest(q).order('bumped_at', { ascending: false }).limit(300);
    if (!err2) {
      const tokens = searchTokens(q.text);
      const have = new Set(rows.map((l) => l.id));
      const extra = (recent as unknown as Row[]).map(listingFromRow).filter((l) => !have.has(l.id) && tokens.every((t) => fuzzyIncludes(normalizeSearch(`${l.title} ${l.description ?? ''}`), t)));
      rows = [...rows, ...extra].slice(0, limit);
    }
  }
  // Best match first when the person typed words and picked no other order.
  return q.text && !q.sort ? sortListings(rows, 'relevance', { text: q.text }) : rows;
}

export async function getListing(id: string): Promise<Listing | null> {
  if (!supabase) return (await loadDemoListings()).find((l) => l.id === id) ?? null;
  const { data, error } = await supabase.from('listings').select(SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? listingFromRow(data as unknown as Row) : null;
}

/** Listings for a set of ids (a guest's favourites). Sold or paused ones are still returned so they can be shown as such. */
export async function getListingsByIds(ids: string[]): Promise<Listing[]> {
  if (ids.length === 0) return [];
  if (!supabase) {
    const all = await loadDemoListings();
    return ids.flatMap((id) => all.filter((l) => l.id === id));
  }
  const { data, error } = await supabase.from('listings').select(SELECT).in('id', ids.slice(0, 200));
  if (error) throw error;
  const rows = (data as unknown as Row[]).map(listingFromRow);
  return ids.flatMap((id) => rows.filter((l) => l.id === id));
}

/** Uploads local picks and returns storage paths in the same order. Already-stored paths pass through. */
async function resolvePhotos(userId: string, listingId: string, photos: string[]): Promise<string[]> {
  if (!supabase) return photos;
  const out: string[] = [];
  for (const [i, p] of photos.entries()) {
    if (!hasScheme(p)) {
      out.push(p);
      continue;
    }
    const bytes = await (await fetch(await shrinkPhoto(p))).arrayBuffer();
    const path = `${userId}/${listingId}/${Date.now()}-${i}.jpg`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: 'image/jpeg' });
    if (error) throw error;
    out.push(path);
  }
  return out;
}

/** The public pin comes from the chosen city's centre, nudged so it never shows a home. Stable per listing id. */
function pinFor(id: string, input: ListingInput) {
  const centre = findCity(input.city, input.country);
  return centre ? approximatePin(centre, id) : null;
}

const toRowFields = (id: string, input: ListingInput, imagePaths: string[]) => ({
  title: input.title.trim(), description: input.description?.trim() || null, price_minor: input.type === 'free' ? 0 : input.priceMinor,
  currency: input.currency, condition: input.condition, type: input.type, category_slug: input.categorySlug, country: input.country,
  city: input.city?.trim() || null, lat: pinFor(id, input)?.lat ?? null, lng: pinFor(id, input)?.lng ?? null, attributes: input.attributes, fixed_price: input.fixedPrice, pre_order: input.preOrder,
  deal_methods: input.dealMethods, image_paths: imagePaths,
});

export async function createListing(userId: string, input: ListingInput, photos: string[]): Promise<Listing> {
  const id = newId();
  if (!supabase) {
    const profile = await getProfile(userId);
    const now = new Date().toISOString();
    const listing: Listing = {
      ...input,
      priceMinor: input.type === 'free' ? 0 : input.priceMinor,
      lat: pinFor(id, input)?.lat ?? null, lng: pinFor(id, input)?.lng ?? null,
      id, sellerId: userId, status: 'active', imagePaths: photos, favoriteCount: 0, soldTo: null, createdAt: now, bumpedAt: now,
      seller: { id: userId, displayName: profile.displayName, avatarUrl: profile.avatarUrl, phoneVerified: profile.phoneVerified, city: profile.city, ratingAvg: profile.ratingAvg, ratingCount: profile.ratingCount },
    };
    await saveDemoListings([listing, ...(await loadDemoListings())]);
    return listing;
  }
  const paths = await resolvePhotos(userId, id, photos);
  const { data, error } = await supabase.from('listings').insert({ id, seller_id: userId, ...toRowFields(id, input, paths) }).select(SELECT).single();
  if (error) throw error;
  return listingFromRow(data as unknown as Row);
}

export async function updateListing(userId: string, id: string, input: ListingInput, photos: string[]): Promise<Listing> {
  if (!supabase) {
    return mutateDemoListing(id, (l) => ({ ...l, ...input, lat: pinFor(id, input)?.lat ?? null, lng: pinFor(id, input)?.lng ?? null, priceMinor: input.type === 'free' ? 0 : input.priceMinor, imagePaths: photos }));
  }
  const paths = await resolvePhotos(userId, id, photos);
  const { data, error } = await supabase.from('listings').update(toRowFields(id, input, paths)).eq('id', id).select(SELECT).single();
  if (error) throw error;
  return listingFromRow(data as unknown as Row);
}

export async function setListingStatus(id: string, status: ListingStatus): Promise<void> {
  if (!supabase) {
    await mutateDemoListing(id, (l) => ({ ...l, status }));
    return;
  }
  const { error } = await supabase.from('listings').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function deleteListing(id: string): Promise<void> {
  if (!supabase) {
    await saveDemoListings((await loadDemoListings()).filter((l) => l.id !== id));
    return;
  }
  const listing = await getListing(id);
  const { error } = await supabase.from('listings').delete().eq('id', id);
  if (error) throw error;
  const stored = (listing?.imagePaths ?? []).filter((p) => !hasScheme(p));
  if (stored.length) await supabase.storage.from(BUCKET).remove(stored); // best effort; the row is already gone
}

const BUMP_INTERVAL_MS = 3_600_000;

/** Moves a listing back to the top of the feed. Allowed once an hour. Throws `bump_too_soon` otherwise. */
export async function bumpListing(id: string): Promise<void> {
  if (!supabase) {
    await mutateDemoListing(id, (l) => {
      if (Date.now() - new Date(l.bumpedAt).getTime() < BUMP_INTERVAL_MS) throw new Error('bump_too_soon');
      return { ...l, bumpedAt: new Date().toISOString() };
    });
    return;
  }
  const { error } = await supabase.from('listings').update({ bumped_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message.includes('bump_too_soon') ? 'bump_too_soon' : error.message);
}

export function canBump(l: Listing, now = Date.now()): boolean {
  return l.status === 'active' && now - new Date(l.bumpedAt).getTime() >= BUMP_INTERVAL_MS;
}

export { normalizeSearch };
