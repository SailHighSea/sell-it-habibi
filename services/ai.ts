import type { Language } from '@/i18n';
import { sanitizeSuggestion, type PhotoSuggestion } from '@/lib/suggestion';
import { supabase } from '@/lib/supabase';

export type { PhotoSuggestion };

type Args = { base64: string; mediaType: 'image/jpeg' | 'image/png' | 'image/webp'; language: Language; currency: string };

/** Asks the `suggest-listing` Edge Function to read the photo. Throws when it can't, so the form stays manual. */
export async function suggestFromPhoto({ base64, mediaType, language, currency }: Args): Promise<PhotoSuggestion> {
  if (!supabase) {
    // Demo mode: no server, so return a plausible fixed suggestion.
    await new Promise((r) => setTimeout(r, 900));
    return sanitizeSuggestion(
      language === 'ar'
        ? { title: 'غرض من صورتك (تجريبي)', category_slug: 'computers-laptops', condition: 'like_new', bullet_points: ['بحالة ممتازة', 'يعمل بشكل سليم'], description_casual: 'للبيع بحالة ممتازة، استخدام خفيف.', description_short: 'بحالة ممتازة.', price_min: 100, price_max: 200 }
        : { title: 'Item from your photo (demo)', category_slug: 'computers-laptops', condition: 'like_new', bullet_points: ['Excellent condition', 'Works perfectly'], description_casual: 'Selling in great shape, lightly used.', description_short: 'Excellent condition.', price_min: 100, price_max: 200 },
    );
  }
  const { data, error } = await supabase.functions.invoke('suggest-listing', { body: { image: base64, mediaType, language, currency } });
  if (error) throw error;
  return sanitizeSuggestion(data);
}
