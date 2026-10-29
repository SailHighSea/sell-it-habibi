import { slugsUnder, topLevelOf } from '@/constants/categories';

import { normalizeSearch, searchTokens } from './arabic';
import { fuzzyIncludes, relevanceScore } from './fuzzy';
import { distanceKm, findCity, type LatLng } from './geo';
import type { FeedTab, Listing, ListingQuery, SortKey } from './listing-types';

/** Where a listing is: its own pin, or the centre of its city when it has none. */
export function listingPoint(l: Listing): LatLng | null {
  if (l.lat != null && l.lng != null) return { lat: l.lat, lng: l.lng };
  const city = findCity(l.city, l.country);
  return city ? { lat: city.lat, lng: city.lng } : null;
}

export function listingDistanceKm(l: Listing, origin: LatLng | null | undefined): number | null {
  const p = origin ? listingPoint(l) : null;
  return origin && p ? distanceKm(origin, p) : null;
}

/** Same rules the Supabase queries apply, used for demo data and tests. */
export function matchesQuery(l: Listing, q: ListingQuery): boolean {
  if (q.country && l.country !== q.country) return false;
  if (q.status !== 'all' && (q.status ?? 'active') !== l.status) return false;
  if (q.sellerId && l.sellerId !== q.sellerId) return false;
  if (q.sellerIds && !q.sellerIds.includes(l.sellerId)) return false;
  if (q.category && !slugsUnder(q.category).includes(l.categorySlug)) return false;
  if (q.freeOnly && l.type !== 'free') return false;
  if (q.minPriceMinor !== undefined && l.priceMinor < q.minPriceMinor) return false;
  if (q.maxPriceMinor !== undefined && l.priceMinor > q.maxPriceMinor) return false;
  if (q.conditions?.length && !q.conditions.includes(l.condition)) return false;
  if (q.city && normalizeSearch(l.city ?? '') !== normalizeSearch(q.city)) return false;
  if (q.near) {
    const km = listingDistanceKm(l, q.near);
    if (km === null || km > q.near.radiusKm) return false;
  }
  if (q.text) {
    const haystack = normalizeSearch(`${l.title} ${l.description ?? ''}`);
    if (!searchTokens(q.text).every((t) => fuzzyIncludes(haystack, t))) return false;
  }
  return true;
}

export function sortListings(list: Listing[], sort: SortKey = 'newest', ctx: { near?: LatLng; text?: string } = {}): Listing[] {
  const byNewest = (a: Listing, b: Listing) => b.bumpedAt.localeCompare(a.bumpedAt);
  const copy = [...list];
  switch (sort) {
    case 'nearest': {
      const km = (l: Listing) => listingDistanceKm(l, ctx.near) ?? Infinity;
      return copy.sort((a, b) => km(a) - km(b) || byNewest(a, b));
    }
    case 'relevance': {
      const tokens = searchTokens(ctx.text ?? '');
      const score = (l: Listing) => relevanceScore(l.title, l.description, tokens);
      return copy.sort((a, b) => score(b) - score(a) || byNewest(a, b));
    }
    case 'priceAsc':
      return copy.sort((a, b) => a.priceMinor - b.priceMinor || byNewest(a, b));
    case 'priceDesc':
      return copy.sort((a, b) => b.priceMinor - a.priceMinor || byNewest(a, b));
    case 'popular':
      return copy.sort((a, b) => b.favoriteCount - a.favoriteCount || byNewest(a, b));
    default:
      return copy.sort(byNewest);
  }
}

export function runQuery(all: Listing[], q: ListingQuery): Listing[] {
  const sort = q.sort ?? (q.text ? 'relevance' : 'newest');
  const sorted = sortListings(all.filter((l) => matchesQuery(l, q)), sort, { near: q.near, text: q.text });
  const from = q.offset ?? 0;
  return sorted.slice(from, from + (q.limit ?? 40));
}

export type TabContext = { near?: { lat: number; lng: number; radiusKm: number } | null; followingIds: string[] };

/** What each home feed tab asks the data layer for. "For you" is ranked afterwards by `rankForYou`. */
export function tabQuery(tab: FeedTab, ctx: TabContext): Partial<ListingQuery> {
  switch (tab) {
    case 'top':
      return { sort: 'popular' };
    case 'nearby':
      return { near: ctx.near ?? undefined, sort: 'nearest' };
    case 'free':
      return { freeOnly: true, sort: 'newest' };
    case 'following':
      return { sellerIds: ctx.followingIds, sort: 'newest' };
    default:
      return { sort: 'newest', limit: 80 };
  }
}

const DAY = 86_400_000;

/** Listings in the user's interest categories first, then by freshness. A listing from a week ago needs one interest match to beat a fresh one. */
export function rankForYou(list: Listing[], interests: string[], now: number = Date.now()): Listing[] {
  const wanted = new Set(interests);
  const score = (l: Listing) => {
    const ageDays = Math.max(0, (now - new Date(l.bumpedAt).getTime()) / DAY);
    const interest = wanted.has(topLevelOf(l.categorySlug)) ? 1 : 0;
    return interest * 7 - ageDays + Math.min(l.favoriteCount, 10) * 0.2;
  };
  return [...list].sort((a, b) => score(b) - score(a));
}
