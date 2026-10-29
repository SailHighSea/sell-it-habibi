import ar from './ar';
import en, { type TranslationKey } from './en';

export type Language = 'en' | 'ar';
export type { TranslationKey };

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
];

const dictionaries: Record<Language, Record<TranslationKey, string>> = { en, ar };

export function isRtl(language: Language): boolean {
  return language === 'ar';
}

export function translate(language: Language, key: TranslationKey, vars?: Record<string, string | number>): string {
  const text = dictionaries[language][key] ?? en[key];
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
}
