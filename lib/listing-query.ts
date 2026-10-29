import { slugsUnder, topLevelOf } from '@/constants/categories';

import { normalizeSearch, searchTokens } from './arabic';
import type { FeedTab, Listing, ListingQuery, SortKey } from './listing-types';

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
  if (q.text) {
    const haystack = normalizeSearch(`${l.title} ${l.description ?? ''}`);
    if (!searchTokens(q.text).every((t) => haystack.includes(t))) return false;
  }
  return true;
}

export function sortListings(list: Listing[], sort: SortKey = 'newest'): Listing[] {
  const byNewest = (a: Listing, b: Listing) => b.bumpedAt.localeCompare(a.bumpedAt);
  const copy = [...list];
  switch (sort) {
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
  return sortListings(all.filter((l) => matchesQuery(l, q)), q.sort).slice(0, q.limit ?? 40);
}

export type TabContext = { city?: string | null; followingIds: string[] };

/** What each home feed tab asks the data layer for. "For you" is ranked afterwards by `rankForYou`. */
export function tabQuery(tab: FeedTab, ctx: TabContext): Partial<ListingQuery> {
  switch (tab) {
    case 'top':
      return { sort: 'popular' };
    case 'nearby':
      return { city: ctx.city ?? undefined, sort: 'newest' };
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
