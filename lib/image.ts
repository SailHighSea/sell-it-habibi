/** Reads a picked image (file://, blob: or data: URI) as base64 without the data-URL prefix. */
export async function uriToBase64(uri: string): Promise<{ base64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp' }> {
  const blob = await (await fetch(uri)).blob();
  const mediaType = blob.type === 'image/png' || blob.type === 'image/webp' ? blob.type : 'image/jpeg';
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
  return { base64, mediaType };
}
