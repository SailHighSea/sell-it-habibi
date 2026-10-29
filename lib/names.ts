import type { Language } from '@/i18n';

/** A name in each language we have it in. English and Arabic are always there; Sinhala is added where translated. */
export type Names = { en: string; ar: string; si?: string };

/** The name in the person's language, or English when that translation is missing. */
export function pickName(names: Names, language: Language): string {
  return names[language] ?? names.en;
}
