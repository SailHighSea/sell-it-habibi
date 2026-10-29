import type { LatLng } from '@/lib/geo';
import type { CountryCode } from '@/constants/countries';

import { searchListings } from './listings';

export type NearbyStats = { newToday: number; free: number; verifiedSellers: number; total: number };

const DAY = 86_400_000;

/** Counts for the Home card, from up to 400 active listings inside the radius. */
export async function nearbyStats(country: CountryCode, near: LatLng & { radiusKm: number }, now = Date.now()): Promise<NearbyStats> {
  const list = await searchListings({ country, near, limit: 400, sort: 'newest' });
  return {
    newToday: list.filter((l) => now - new Date(l.createdAt).getTime() < DAY).length,
    free: list.filter((l) => l.type === 'free').length,
    verifiedSellers: new Set(list.filter((l) => l.seller?.phoneVerified).map((l) => l.sellerId)).size,
    total: list.length,
  };
}
