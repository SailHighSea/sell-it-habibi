// Keep in sync with public.normalize_search in supabase/migrations/0002_listings_discovery.sql.

const FOLD: Record<string, string> = {
  'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا', 'ى': 'ي', 'ة': 'ه',
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

/** Lowercase, strip diacritics and tatweel, fold alef forms / ya / ta marbuta, Arabic-Indic digits to Latin. */
export function normalizeSearch(text: string): string {
  return (text ?? '')
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآٱىة٠-٩]/g, (c) => FOLD[c] ?? c)
    .toLowerCase();
}

export function searchTokens(text: string): string[] {
  return normalizeSearch(text).split(/\s+/).filter(Boolean).slice(0, 8);
}
