import type { Country } from '@/constants/countries';

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** Keep digits only, convert Arabic-Indic digits, drop a leading 0 (e.g. 050… -> 50…). */
export function normalizeNational(input: string): string {
  const digits = input.replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d))).replace(/\D/g, '');
  return digits.replace(/^0+/, '');
}

export function isValidNational(input: string, country: Country): boolean {
  const n = normalizeNational(input).length;
  return n >= country.phoneLength[0] && n <= country.phoneLength[1];
}

/** E.164 number, e.g. +971501234567. */
export function toE164(input: string, country: Country): string {
  return `${country.dial}${normalizeNational(input)}`;
}
