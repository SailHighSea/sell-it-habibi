import { slugsUnder } from '@/constants/categories';
import type { CountryCode } from '@/constants/countries';
import { normalizeSearch, searchTokens } from '@/lib/arabic';
import { newId } from '@/lib/id';
import { runQuery } from '@/lib/listing-query';
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
  city: string | null; status: ListingStatus; attributes: Listing['attributes']; fixed_price: boolean; pre_order: boolean;
  deal_methods: Listing['dealMethods']; image_paths: string[]; favorite_count: number; sold_to: string | null; created_at: string; bumped_at: string;
};


export function listingFromRow(r: Row): Listing {
  return {
    id: r.id, sellerId: r.seller_id, seller: r.seller ? sellerFromRow(r.seller) : undefined, title: r.title, description: r.description,
    priceMinor: Number(r.price_minor), currency: r.currency, condition: r.condition, type: r.type, categorySlug: r.category_slug,
    country: r.country, city: r.city, status: r.status, attributes: r.attributes ?? {}, fixedPrice: r.fixed_price,
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

/** Escape LIKE wildcards so user text can't widen a match. */
const likeEscape = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

export async function searchListings(q: ListingQuery): Promise<Listing[]> {
  if (!isSupabaseConfigured || !supabase) return runQuery(await loadDemoListings(), q);

  let req = supabase.from('listings').select(SELECT);
  if (q.country) req = req.eq('country', q.country);
  if (q.status !== 'all') req = req.eq('status', q.status ?? 'active');
  if (q.sellerId) req = req.eq('seller_id', q.sellerId);
  if (q.sellerIds) {
    if (q.sellerIds.length === 0) return [];
    req = req.in('seller_id', q.sellerIds);
  }
  if (q.category) req = req.in('category_slug', slugsUnder(q.category));
  if (q.freeOnly) req = req.eq('type', 'free');
  if (q.minPriceMinor !== undefined) req = req.gte('price_minor', q.minPriceMinor);
  if (q.maxPriceMinor !== undefined) req = req.lte('price_minor', q.maxPriceMinor);
  if (q.conditions?.length) req = req.in('condition', q.conditions);
  if (q.city) req = req.ilike('city', likeEscape(q.city.trim()));
  if (q.text) for (const token of searchTokens(q.text)) req = req.ilike('search_text', `%${likeEscape(token)}%`);

  switch (q.sort) {
    case 'priceAsc': req = req.order('price_minor', { ascending: true }).order('bumped_at', { ascending: false }); break;
    case 'priceDesc': req = req.order('price_minor', { ascending: false }).order('bumped_at', { ascending: false }); break;
    case 'popular': req = req.order('favorite_count', { ascending: false }).order('bumped_at', { ascending: false }); break;
    default: req = req.order('bumped_at', { ascending: false });
  }
  const { data, error } = await req.limit(q.limit ?? 40);
  if (error) throw error;
  return (data as unknown as Row[]).map(listingFromRow);
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
    const bytes = await (await fetch(p)).arrayBuffer();
    const path = `${userId}/${listingId}/${Date.now()}-${i}.jpg`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: 'image/jpeg' });
    if (error) throw error;
    out.push(path);
  }
  return out;
}

const toRowFields = (input: ListingInput, imagePaths: string[]) => ({
  title: input.title.trim(), description: input.description?.trim() || null, price_minor: input.type === 'free' ? 0 : input.priceMinor,
  currency: input.currency, condition: input.condition, type: input.type, category_slug: input.categorySlug, country: input.country,
  city: input.city?.trim() || null, attributes: input.attributes, fixed_price: input.fixedPrice, pre_order: input.preOrder,
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
      id, sellerId: userId, status: 'active', imagePaths: photos, favoriteCount: 0, soldTo: null, createdAt: now, bumpedAt: now,
      seller: { id: userId, displayName: profile.displayName, avatarUrl: profile.avatarUrl, phoneVerified: profile.phoneVerified, city: profile.city, ratingAvg: profile.ratingAvg, ratingCount: profile.ratingCount },
    };
    await saveDemoListings([listing, ...(await loadDemoListings())]);
    return listing;
  }
  const paths = await resolvePhotos(userId, id, photos);
  const { data, error } = await supabase.from('listings').insert({ id, seller_id: userId, ...toRowFields(input, paths) }).select(SELECT).single();
  if (error) throw error;
  return listingFromRow(data as unknown as Row);
}

export async function updateListing(userId: string, id: string, input: ListingInput, photos: string[]): Promise<Listing> {
  if (!supabase) {
    return mutateDemoListing(id, (l) => ({ ...l, ...input, priceMinor: input.type === 'free' ? 0 : input.priceMinor, imagePaths: photos }));
  }
  const paths = await resolvePhotos(userId, id, photos);
  const { data, error } = await supabase.from('listings').update(toRowFields(input, paths)).eq('id', id).select(SELECT).single();
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
