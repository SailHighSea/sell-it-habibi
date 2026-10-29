import * as Device from 'expo-device';
import { Platform } from 'react-native';

/**
 * True for phones likely to struggle with blur and see-through layers: under about 3.5 GB of memory, or Android 9 and
 * older. Unknown means false, so a phone is not downgraded on a guess. Web is never low-end by this test.
 */
export function isLowEndDevice(): boolean {
  if (Platform.OS === 'web') return false;
  const bytes = Device.totalMemory;
  if (typeof bytes === 'number' && bytes > 0 && bytes < 3.5 * 1024 ** 3) return true;
  return Platform.OS === 'android' && typeof Platform.Version === 'number' && Platform.Version < 29;
}
