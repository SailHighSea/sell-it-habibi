import { formatNumber } from './intl';

// Money is stored as integer minor units (fils, halalas…), never floats.

const MINOR_DIGITS: Record<string, number> = { AED: 2, SAR: 2, QAR: 2, EGP: 2, JOD: 3, KWD: 3, BHD: 3, OMR: 3 };

export function minorDigits(currency: string): number {
  return MINOR_DIGITS[currency] ?? 2;
}

/** "12.50" -> 1250 (AED). Returns null when the text isn't a valid non-negative amount. */
export function parseMinor(text: string, currency: string): number | null {
  const digits = minorDigits(currency);
  const normalized = text.trim().replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[,٬]/g, '').replace('٫', '.');
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  const [whole, frac = ''] = normalized.split('.');
  if (frac.length > digits) return null;
  return Number(whole) * 10 ** digits + Number(frac.padEnd(digits, '0') || '0');
}

export function formatMinor(minor: number, currency: string, locale: string): string {
  const digits = minorDigits(currency);
  const major = minor / 10 ** digits;
  return formatNumber(
    major,
    locale,
    { style: 'currency', currency, minimumFractionDigits: Number.isInteger(major) ? 0 : digits, maximumFractionDigits: digits },
    () => `${currency} ${Number.isInteger(major) ? major : major.toFixed(digits)}`,
  );
}
