export type CountryCode = 'AE' | 'SA' | 'QA' | 'KW' | 'BH' | 'OM' | 'LK';

export type Country = {
  code: CountryCode;
  dial: string;
  currency: string;
  name: { en: string; ar: string };
  /** Min/max national number length (without the dial code and leading 0). */
  phoneLength: [number, number];
};

export const COUNTRIES: Country[] = [
  { code: 'AE', dial: '+971', currency: 'AED', name: { en: 'United Arab Emirates', ar: 'الإمارات العربية المتحدة' }, phoneLength: [9, 9] },
  { code: 'SA', dial: '+966', currency: 'SAR', name: { en: 'Saudi Arabia', ar: 'المملكة العربية السعودية' }, phoneLength: [9, 9] },
  { code: 'QA', dial: '+974', currency: 'QAR', name: { en: 'Qatar', ar: 'قطر' }, phoneLength: [8, 8] },
  { code: 'KW', dial: '+965', currency: 'KWD', name: { en: 'Kuwait', ar: 'الكويت' }, phoneLength: [8, 8] },
  { code: 'BH', dial: '+973', currency: 'BHD', name: { en: 'Bahrain', ar: 'البحرين' }, phoneLength: [8, 8] },
  { code: 'OM', dial: '+968', currency: 'OMR', name: { en: 'Oman', ar: 'عُمان' }, phoneLength: [8, 8] },
  { code: 'LK', dial: '+94', currency: 'LKR', name: { en: 'Sri Lanka', ar: 'سريلانكا' }, phoneLength: [9, 9] },
];

export const DEFAULT_COUNTRY: CountryCode = 'AE';

export function getCountry(code: string | null | undefined): Country {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}
