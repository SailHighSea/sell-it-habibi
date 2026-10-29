import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from './supabase';

let registeredToken: string | null = null;

/**
 * Asks for permission and saves this phone's Expo push token for the user.
 * Does nothing on web, simulators, without Supabase, or before the app has an EAS project id (`eas init`).
 * Returns true when a token was saved.
 */
export async function registerPushToken(userId: string): Promise<boolean> {
  if (Platform.OS === 'web' || !Device.isDevice || !supabase) return false;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', { name: 'Messages and offers', importance: Notifications.AndroidImportance.HIGH });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return false;

    const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return false;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    const { error } = await supabase
      .from('push_tokens')
      .upsert({ token, user_id: userId, platform: Platform.OS === 'ios' ? 'ios' : 'android', updated_at: new Date().toISOString() });
    if (error) return false;
    registeredToken = token;
    return true;
  } catch {
    return false;
  }
}

/** Stops pushes to this phone (notifications turned off, or signing out). */
export async function unregisterPushToken(): Promise<void> {
  if (!supabase || !registeredToken) return;
  await supabase.from('push_tokens').delete().eq('token', registeredToken);
  registeredToken = null;
}
