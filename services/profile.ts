import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_COUNTRY, type CountryCode } from '@/constants/countries';
import { validateDisplayName } from '@/lib/display-name';
import type { Seller } from '@/lib/listing-types';
import { SELLER_COLUMNS, sellerFromRow } from '@/lib/seller';
import { supabase } from '@/lib/supabase';

import { demoSeller, loadDemoListings } from './demo-store';

export { validateDisplayName };

export type Profile = {
  id: string;
  displayName: string | null;
  bio: string | null;
  city: string | null;
  country: CountryCode;
  avatarUrl: string | null;
  interests: string[];
  phoneVerified: boolean;
  onboarded: boolean;
  role: 'user' | 'moderator' | 'admin';
  ratingAvg: number | null;
  ratingCount: number;
};

export type ProfilePatch = Partial<Pick<Profile, 'displayName' | 'bio' | 'city' | 'country' | 'avatarUrl' | 'interests' | 'onboarded'>>;

const demoKey = (id: string) => `sih.demo.profile.${id}`;

type Row = {
  id: string;
  display_name: string | null;
  bio: string | null;
  city: string | null;
  country: CountryCode;
  avatar_url: string | null;
  interests: string[];
  phone_verified: boolean;
  onboarded: boolean;
  role: Profile['role'];
  rating_avg: number | null;
  rating_count: number;
};

function fromRow(r: Row): Profile {
  return {
    id: r.id,
    displayName: r.display_name,
    bio: r.bio,
    city: r.city,
    country: r.country,
    avatarUrl: r.avatar_url,
    interests: r.interests ?? [],
    phoneVerified: r.phone_verified,
    onboarded: r.onboarded,
    role: r.role ?? 'user',
    ratingAvg: r.rating_avg === null ? null : Number(r.rating_avg),
    ratingCount: r.rating_count ?? 0,
  };
}

function emptyProfile(id: string): Profile {
  return { id, displayName: null, bio: null, city: null, country: DEFAULT_COUNTRY, avatarUrl: null, interests: [], phoneVerified: false, onboarded: false, role: 'user', ratingAvg: null, ratingCount: 0 };
}

export async function getProfile(userId: string): Promise<Profile> {
  if (!supabase) {
    const raw = await AsyncStorage.getItem(demoKey(userId));
    // In demo mode everyone is an admin so the moderation screen can be tried without a server.
    return { ...(raw ? (JSON.parse(raw) as Profile) : { ...emptyProfile(userId), phoneVerified: true }), role: 'admin' };
  }
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as Row) : emptyProfile(userId);
}

export async function saveProfile(userId: string, patch: ProfilePatch): Promise<Profile> {
  if (patch.displayName !== undefined && patch.displayName !== null && !validateDisplayName(patch.displayName)) {
    throw new Error('invalid_display_name');
  }
  if (!supabase) {
    const next = { ...(await getProfile(userId)), ...patch };
    await AsyncStorage.setItem(demoKey(userId), JSON.stringify(next));
    return next;
  }
  const update: Record<string, unknown> = {};
  if (patch.displayName !== undefined) update.display_name = patch.displayName?.trim() ?? null;
  if (patch.bio !== undefined) update.bio = patch.bio;
  if (patch.city !== undefined) update.city = patch.city;
  if (patch.country !== undefined) update.country = patch.country;
  if (patch.avatarUrl !== undefined) update.avatar_url = patch.avatarUrl;
  if (patch.interests !== undefined) update.interests = patch.interests;
  if (patch.onboarded !== undefined) update.onboarded = patch.onboarded;
  const { data, error } = await supabase.from('profiles').update(update).eq('id', userId).select('*').single();
  if (error) throw error;
  return fromRow(data as Row);
}

/** Uploads a picked image to the public avatars bucket and returns its URL. */
export async function uploadAvatar(userId: string, uri: string): Promise<string> {
  if (!supabase) return uri;
  const bytes = await (await fetch(uri)).arrayBuffer();
  const path = `${userId}/avatar.jpg`;
  const { error } = await supabase.storage.from('avatars').upload(path, bytes, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

/** Public details of any seller (name, photo, verification). */
export async function getSeller(id: string): Promise<Seller | null> {
  if (!supabase) {
    // Ratings move when someone reviews, so prefer the seller as stored on their listings.
    const fromListing = (await loadDemoListings()).find((l) => l.sellerId === id)?.seller;
    const demo = fromListing ?? demoSeller(id);
    if (demo) return demo;
    const p = await getProfile(id);
    return { id, displayName: p.displayName, avatarUrl: p.avatarUrl, phoneVerified: p.phoneVerified, city: p.city, ratingAvg: p.ratingAvg, ratingCount: p.ratingCount };
  }
  const { data, error } = await supabase.from('profiles').select(SELLER_COLUMNS).eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? sellerFromRow(data as unknown as Parameters<typeof sellerFromRow>[0]) : null;
}
