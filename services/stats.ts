import type { CountryCode } from '@/constants/countries';
import type { LatLng } from '@/lib/geo';
import { supabase } from '@/lib/supabase';

import { searchListings } from './listings';

export type NearbyStats = { newToday: number; free: number; verifiedSellers: number; total: number };

const DAY = 86_400_000;

/** Counts for the Home card. With a server this is one database call (`nearby_stats`); in demo mode it counts the local listings. */
export async function nearbyStats(country: CountryCode, near: LatLng & { radiusKm: number }, now = Date.now()): Promise<NearbyStats> {
  if (supabase) {
    const { data, error } = await supabase.rpc('nearby_stats', { p_country: country, p_lat: near.lat, p_lng: near.lng, p_radius_km: near.radiusKm });
    if (error) throw error;
    const row = (data as { new_today: number; free_items: number; verified_sellers: number; total: number }[])[0];
    return { newToday: Number(row?.new_today ?? 0), free: Number(row?.free_items ?? 0), verifiedSellers: Number(row?.verified_sellers ?? 0), total: Number(row?.total ?? 0) };
  }
  const list = await searchListings({ country, near, limit: 400, sort: 'newest' });
  return {
    newToday: list.filter((l) => now - new Date(l.createdAt).getTime() < DAY).length,
    free: list.filter((l) => l.type === 'free').length,
    verifiedSellers: new Set(list.filter((l) => l.seller?.phoneVerified).map((l) => l.sellerId)).size,
    total: list.length,
  };
}
