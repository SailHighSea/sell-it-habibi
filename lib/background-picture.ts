import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { shrinkPhoto } from './photo';

/**
 * Lets the person choose a picture from their library for the app background. The picture is shrunk (1600 px is plenty for a
 * blurred background) and, on a phone, copied into the app's own storage so it is still there after the cache is cleared.
 * Resolves to the picture's address, or null when they cancel.
 */
export async function chooseBackgroundPicture(): Promise<string | null> {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
  if (res.canceled || !res.assets[0]) return null;
  const small = await shrinkPhoto(res.assets[0].uri, 1600, 0.8);
  if (Platform.OS === 'web') return small;
  try {
    const { File, Paths } = await import('expo-file-system');
    const target = new File(Paths.document, `background-${Date.now()}.jpg`);
    new File(small).copy(target);
    return target.uri;
  } catch {
    return small;
  }
}
