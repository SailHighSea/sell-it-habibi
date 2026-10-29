import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

/**
 * Shrinks a photo before it is uploaded or sent for AI reading: longest side `maxSide` px, JPEG at `quality`.
 * A 12 MP phone photo is 3 to 6 MB; this makes it about 150 to 300 KB, which is faster to upload, cheaper for the
 * server and much lighter to show on small phones. If shrinking fails the original is used.
 */
export async function shrinkPhoto(uri: string, maxSide = 1280, quality = 0.75): Promise<string> {
  try {
    const first = await manipulateAsync(uri, [], { format: SaveFormat.JPEG, compress: 1 });
    const resize = first.width >= first.height ? { width: Math.min(maxSide, first.width) } : { height: Math.min(maxSide, first.height) };
    const out = await manipulateAsync(uri, [{ resize }], { format: SaveFormat.JPEG, compress: quality });
    return out.uri;
  } catch {
    return uri;
  }
}
