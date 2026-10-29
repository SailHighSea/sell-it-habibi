import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_COUNTRY, type CountryCode } from '@/constants/countries';
import { validateDisplayName } from '@/lib/display-name';
import { supabase } from '@/lib/supabase';

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
  };
}

function emptyProfile(id: string): Profile {
  return { id, displayName: null, bio: null, city: null, country: DEFAULT_COUNTRY, avatarUrl: null, interests: [], phoneVerified: false, onboarded: false };
}

export async function getProfile(userId: string): Promise<Profile> {
  if (!supabase) {
    const raw = await AsyncStorage.getItem(demoKey(userId));
    return raw ? (JSON.parse(raw) as Profile) : { ...emptyProfile(userId), phoneVerified: true };
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
