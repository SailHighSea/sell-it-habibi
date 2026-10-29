export const DISPLAY_NAME_MAX = 30;

/** Display names are public. They must not look like an email address or a phone number. */
export function validateDisplayName(raw: string): boolean {
  const name = raw.trim();
  if (name.length < 2 || name.length > DISPLAY_NAME_MAX) return false;
  if (name.includes('@')) return false;
  if (name.replace(/\D/g, '').length >= 7) return false;
  return true;
}
