import AsyncStorage from '@react-native-async-storage/async-storage';

import { newId } from '@/lib/id';
import type { Listing, SavedQuery, SavedSearch } from '@/lib/listing-types';
import { supabase } from '@/lib/supabase';

import { mutateDemoListing } from './demo-store';
import { LISTING_SELECT, getListingsByIds, listingFromRow, searchListings } from './listings';

// Guests (no account) keep likes, follows and saved searches on the phone. Signed-in users use the server,
// or local demo storage when there is no server. `mergeGuestData` moves the guest's items into the account at sign-in.
const GUEST = 'sih.guest';
const demoKey = (kind: string, userId: string | null) => (userId ? `sih.demo.${kind}.${userId}` : `${GUEST}.${kind}`);
const isLocal = (userId: string | null) => !supabase || !userId;

async function readList<T>(key: string): Promise<T[]> {
  try {
    return JSON.parse((await AsyncStorage.getItem(key)) ?? '[]') as T[];
  } catch {
    return [];
  }
}

// ---------- favourites ----------
export async function getFavoriteIds(userId: string | null): Promise<string[]> {
  if (isLocal(userId) || !supabase) return readList<string>(demoKey('fav', userId));
  const { data, error } = await supabase.from('favorites').select('listing_id').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.listing_id as string);
}

export async function setFavorite(userId: string | null, listingId: string, on: boolean): Promise<void> {
  if (isLocal(userId) || !supabase) {
    const ids = new Set(await readList<string>(demoKey('fav', userId)));
    if (on === ids.has(listingId)) return;
    if (on) ids.add(listingId);
    else ids.delete(listingId);
    await AsyncStorage.setItem(demoKey('fav', userId), JSON.stringify([...ids]));
    // Public like counts only change for real accounts (and in demo mode, which has no server).
    if (!supabase) await mutateDemoListing(listingId, (l) => ({ ...l, favoriteCount: Math.max(0, l.favoriteCount + (on ? 1 : -1)) })).catch(() => {});
    return;
  }
  const { error } = on
    ? await supabase.from('favorites').upsert({ user_id: userId, listing_id: listingId })
    : await supabase.from('favorites').delete().eq('user_id', userId).eq('listing_id', listingId);
  if (error) throw error;
}

export async function fetchFavoriteListings(userId: string | null): Promise<Listing[]> {
  if (isLocal(userId) || !supabase) return getListingsByIds((await readList<string>(demoKey('fav', userId))).reverse());
  const { data, error } = await supabase
    .from('favorites')
    .select(`created_at, listing:listings(${LISTING_SELECT})`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).flatMap((r) => (r.listing ? [listingFromRow(r.listing as never)] : []));
}

// ---------- follows ----------
export async function getFollowingIds(userId: string | null): Promise<string[]> {
  if (isLocal(userId) || !supabase) return readList<string>(demoKey('follow', userId));
  const { data, error } = await supabase.from('follows').select('followee_id').eq('follower_id', userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.followee_id as string);
}

export async function setFollow(userId: string | null, sellerId: string, on: boolean): Promise<void> {
  if (userId === sellerId) return;
  if (isLocal(userId) || !supabase) {
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
export async function getSavedSearches(userId: string | null): Promise<SavedSearch[]> {
  if (isLocal(userId) || !supabase) return readList<SavedSearch>(demoKey('saved', userId));
  const { data, error } = await supabase.from('saved_searches').select('id,name,query').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as SavedSearch[];
}

export async function addSavedSearch(userId: string | null, name: string, query: SavedQuery): Promise<SavedSearch> {
  const entry: SavedSearch = { id: newId(), name: name.slice(0, 80), query };
  if (isLocal(userId) || !supabase) {
    await AsyncStorage.setItem(demoKey('saved', userId), JSON.stringify([entry, ...(await getSavedSearches(userId))].slice(0, 20)));
    return entry;
  }
  const { data, error } = await supabase.from('saved_searches').insert({ id: entry.id, user_id: userId, name: entry.name, query }).select('id,name,query').single();
  if (error) throw error;
  return data as SavedSearch;
}

export async function removeSavedSearch(userId: string | null, id: string): Promise<void> {
  if (isLocal(userId) || !supabase) {
    await AsyncStorage.setItem(demoKey('saved', userId), JSON.stringify((await getSavedSearches(userId)).filter((s) => s.id !== id)));
    return;
  }
  const { error } = await supabase.from('saved_searches').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

/**
 * Moves what a guest liked, followed and saved on this phone into the account they just signed in to.
 * Guest data is cleared only after everything has been copied, so a failure leaves it intact for next time.
 */
export async function mergeGuestData(userId: string): Promise<void> {
  const [favs, follows, saved] = await Promise.all([
    readList<string>(demoKey('fav', null)),
    readList<string>(demoKey('follow', null)),
    readList<SavedSearch>(demoKey('saved', null)),
  ]);
  if (favs.length + follows.length + saved.length === 0) return;
  const have = new Set((await getSavedSearches(userId)).map((s) => JSON.stringify(s.query)));
  try {
    for (const id of favs) await setFavorite(userId, id, true);
    for (const id of follows) await setFollow(userId, id, true);
    for (const s of saved.reverse()) if (!have.has(JSON.stringify(s.query))) await addSavedSearch(userId, s.name, s.query);
  } catch {
    return;
  }
  await Promise.all(['fav', 'follow', 'saved'].map((k) => AsyncStorage.removeItem(demoKey(k, null)).catch(() => {})));
}

export { searchListings };
