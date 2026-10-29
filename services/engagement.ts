import AsyncStorage from '@react-native-async-storage/async-storage';

import { newId } from '@/lib/id';
import type { Listing, SavedQuery, SavedSearch } from '@/lib/listing-types';
import { supabase } from '@/lib/supabase';

import { mutateDemoListing } from './demo-store';
import { LISTING_SELECT, listingFromRow, searchListings } from './listings';

const demoKey = (kind: string, userId: string) => `sih.demo.${kind}.${userId}`;

async function readList<T>(key: string): Promise<T[]> {
  try {
    return JSON.parse((await AsyncStorage.getItem(key)) ?? '[]') as T[];
  } catch {
    return [];
  }
}

// ---------- favourites ----------
export async function getFavoriteIds(userId: string): Promise<string[]> {
  if (!supabase) return readList<string>(demoKey('fav', userId));
  const { data, error } = await supabase.from('favorites').select('listing_id').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.listing_id as string);
}

export async function setFavorite(userId: string, listingId: string, on: boolean): Promise<void> {
  if (!supabase) {
    const ids = new Set(await readList<string>(demoKey('fav', userId)));
    if (on === ids.has(listingId)) return;
    if (on) ids.add(listingId);
    else ids.delete(listingId);
    await AsyncStorage.setItem(demoKey('fav', userId), JSON.stringify([...ids]));
    await mutateDemoListing(listingId, (l) => ({ ...l, favoriteCount: Math.max(0, l.favoriteCount + (on ? 1 : -1)) })).catch(() => {});
    return;
  }
  const { error } = on
    ? await supabase.from('favorites').upsert({ user_id: userId, listing_id: listingId })
    : await supabase.from('favorites').delete().eq('user_id', userId).eq('listing_id', listingId);
  if (error) throw error;
}

export async function fetchFavoriteListings(userId: string): Promise<Listing[]> {
  if (!supabase) {
    const ids = new Set(await readList<string>(demoKey('fav', userId)));
    const { loadDemoListings } = await import('./demo-store');
    return (await loadDemoListings()).filter((l) => ids.has(l.id));
  }
  const { data, error } = await supabase
    .from('favorites')
    .select(`created_at, listing:listings(${LISTING_SELECT})`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).flatMap((r) => (r.listing ? [listingFromRow(r.listing as never)] : []));
}

// ---------- follows ----------
export async function getFollowingIds(userId: string): Promise<string[]> {
  if (!supabase) return readList<string>(demoKey('follow', userId));
  const { data, error } = await supabase.from('follows').select('followee_id').eq('follower_id', userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.followee_id as string);
}

export async function setFollow(userId: string, sellerId: string, on: boolean): Promise<void> {
  if (userId === sellerId) return;
  if (!supabase) {
    const ids = new Set(await readList<string>(demoKey('follow', userId)));
    if (on) ids.add(sellerId);
    else ids.delete(sellerId);
    await AsyncStorage.setItem(demoKey('follow', userId), JSON.stringify([...ids]));
    return;
  }
  const { error } = on
    ? await supabase.from('follows').upsert({ follower_id: userId, followee_id: sellerId })
    : await supabase.from('follows').delete().eq('follower_id', userId).eq('followee_id', sellerId);
  if (error) throw error;
}

// ---------- saved searches ----------
export async function getSavedSearches(userId: string): Promise<SavedSearch[]> {
  if (!supabase) return readList<SavedSearch>(demoKey('saved', userId));
  const { data, error } = await supabase.from('saved_searches').select('id,name,query').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as SavedSearch[];
}

export async function addSavedSearch(userId: string, name: string, query: SavedQuery): Promise<SavedSearch> {
  const entry: SavedSearch = { id: newId(), name: name.slice(0, 80), query };
  if (!supabase) {
    await AsyncStorage.setItem(demoKey('saved', userId), JSON.stringify([entry, ...(await getSavedSearches(userId))].slice(0, 20)));
    return entry;
  }
  const { data, error } = await supabase.from('saved_searches').insert({ id: entry.id, user_id: userId, name: entry.name, query }).select('id,name,query').single();
  if (error) throw error;
  return data as SavedSearch;
}

export async function removeSavedSearch(userId: string, id: string): Promise<void> {
  if (!supabase) {
    await AsyncStorage.setItem(demoKey('saved', userId), JSON.stringify((await getSavedSearches(userId)).filter((s) => s.id !== id)));
    return;
  }
  const { error } = await supabase.from('saved_searches').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

export { searchListings };
