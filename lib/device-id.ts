import AsyncStorage from '@react-native-async-storage/async-storage';

import { newId } from './id';

const KEY = 'sih.device.id';
let cached: string | null = null;

/**
 * A random id for this install. Guests send it with a report so the server can limit how many one phone can send.
 * It is not linked to a person, and the server only stores a one-way hash of it.
 */
export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  try {
    const existing = await AsyncStorage.getItem(KEY);
    if (existing) return (cached = existing);
    const fresh = newId();
    await AsyncStorage.setItem(KEY, fresh);
    return (cached = fresh);
  } catch {
    return (cached = newId());
  }
}
