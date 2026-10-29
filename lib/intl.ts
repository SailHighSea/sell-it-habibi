// Android's JavaScript engine (Hermes) has number and date formatting but not every Intl feature, and it can reject
// some locale tags. These helpers never throw: they try the requested locale, then English, then plain text.

export function formatDate(date: Date, locale: string, options: Intl.DateTimeFormatOptions): string {
  for (const l of [locale, 'en']) {
    try {
      return new Intl.DateTimeFormat(l, options).format(date);
    } catch {
      // try the next locale
    }
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function formatNumber(value: number, locale: string, options: Intl.NumberFormatOptions, fallback: () => string): string {
  for (const l of [locale, 'en']) {
    try {
      return new Intl.NumberFormat(l, options).format(value);
    } catch {
      // try the next locale
    }
  }
  return fallback();
}
