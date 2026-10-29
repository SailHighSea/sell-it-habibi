import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export type AuthUser = { id: string; phone: string | null };
export type OAuthProvider = 'google' | 'apple';

export const DEMO_CODE = '123456';
const DEMO_KEY = 'sih.demo.session';

WebBrowser.maybeCompleteAuthSession();

// ---------- demo mode (no Supabase env vars) ----------
const demoListeners = new Set<(u: AuthUser | null) => void>();

async function readDemo(): Promise<AuthUser | null> {
  try {
    return JSON.parse((await AsyncStorage.getItem(DEMO_KEY)) ?? 'null') as AuthUser | null;
  } catch {
    return null;
  }
}

async function writeDemo(user: AuthUser | null) {
  if (user) await AsyncStorage.setItem(DEMO_KEY, JSON.stringify(user));
  else await AsyncStorage.removeItem(DEMO_KEY);
  demoListeners.forEach((cb) => cb(user));
}

// ---------- public API ----------
/** Calls back with the current user right away and on every change. Returns an unsubscribe function. */
export function onAuthChange(cb: (user: AuthUser | null) => void): () => void {
  if (!supabase) {
    demoListeners.add(cb);
    readDemo().then(cb);
    return () => demoListeners.delete(cb);
  }
  supabase.auth.getSession().then(({ data }) => cb(toUser(data.session?.user)));
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(toUser(session?.user)));
  return () => data.subscription.unsubscribe();
}

function toUser(u: { id: string; phone?: string } | null | undefined): AuthUser | null {
  return u ? { id: u.id, phone: u.phone ? `+${u.phone.replace(/^\+/, '')}` : null } : null;
}

export async function sendPhoneCode(e164: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signInWithOtp({ phone: e164 });
  if (error) throw error;
}

/** Throws when the code is wrong or expired. */
export async function verifyPhoneCode(e164: string, code: string): Promise<void> {
  if (!supabase) {
    if (code !== DEMO_CODE) throw new Error('invalid_code');
    await writeDemo({ id: `demo-${e164.replace(/\D/g, '')}`, phone: e164 });
    return;
  }
  const { error } = await supabase.auth.verifyOtp({ phone: e164, token: code, type: 'sms' });
  if (error) throw error;
}

/** Google or Apple through Supabase's OAuth flow. Needs the provider enabled in the Supabase dashboard. */
export async function signInWithProvider(provider: OAuthProvider): Promise<void> {
  if (!supabase) {
    await writeDemo({ id: `demo-${provider}`, phone: null });
    return;
  }
  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
    if (error) throw error;
    return;
  }
  const redirectTo = Linking.createURL('auth/callback');
  const { data, error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true } });
  if (error || !data.url) throw error ?? new Error('no_oauth_url');
  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') throw new Error('oauth_cancelled');
  const params = new URLSearchParams(result.url.split('#')[1] ?? '');
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) throw new Error('oauth_no_tokens');
  const { error: sessionError } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  if (sessionError) throw sessionError;
}

export async function signOut(): Promise<void> {
  if (!supabase) return writeDemo(null);
  await supabase.auth.signOut();
}

export { isSupabaseConfigured };
