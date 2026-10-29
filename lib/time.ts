import type { Language } from '@/i18n';

const UNITS = [
  { unit: 'year', seconds: 31_536_000 },
  { unit: 'month', seconds: 2_592_000 },
  { unit: 'week', seconds: 604_800 },
  { unit: 'day', seconds: 86_400 },
  { unit: 'hour', seconds: 3_600 },
  { unit: 'minute', seconds: 60 },
] as const;

type Unit = (typeof UNITS)[number]['unit'];

const EN: Record<Unit, string> = { year: 'yr', month: 'mo', week: 'wk', day: 'd', hour: 'hr', minute: 'min' };

// Arabic has separate forms for one, two, three to ten, and eleven or more.
const AR: Record<Unit, { one: string; two: string; few: string; many: string }> = {
  year: { one: 'قبل سنة', two: 'قبل سنتين', few: 'قبل {n} سنوات', many: 'قبل {n} سنة' },
  month: { one: 'قبل شهر', two: 'قبل شهرين', few: 'قبل {n} أشهر', many: 'قبل {n} شهرًا' },
  week: { one: 'قبل أسبوع', two: 'قبل أسبوعين', few: 'قبل {n} أسابيع', many: 'قبل {n} أسبوعًا' },
  day: { one: 'أمس', two: 'قبل يومين', few: 'قبل {n} أيام', many: 'قبل {n} يومًا' },
  hour: { one: 'قبل ساعة', two: 'قبل ساعتين', few: 'قبل {n} ساعات', many: 'قبل {n} ساعة' },
  minute: { one: 'قبل دقيقة', two: 'قبل دقيقتين', few: 'قبل {n} دقائق', many: 'قبل {n} دقيقة' },
};

// Sinhala puts the amount before the unit and "කට පෙර" (before) after it. No plural forms.
const SI: Record<Unit, string> = { year: 'අවුරුදු', month: 'මාස', week: 'සති', day: 'දින', hour: 'පැය', minute: 'මිනිත්තු' };

/**
 * "2 hr ago" / "قبل ساعتين". Written by hand because Android's JavaScript engine has no Intl.RelativeTimeFormat.
 * Dates in the future (a clock that is slightly off) read as "just now".
 */
export function timeAgo(iso: string, language: Language, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  const found = UNITS.find((u) => seconds >= u.seconds);
  if (!found) return language === 'ar' ? 'الآن' : language === 'si' ? 'මේ දැන්' : 'just now';
  const n = Math.floor(seconds / found.seconds);
  if (language === 'ar') {
    const forms = AR[found.unit];
    const form = n === 1 ? forms.one : n === 2 ? forms.two : n <= 10 ? forms.few : forms.many;
    return form.replace('{n}', String(n));
  }
  if (language === 'si') return `${SI[found.unit]} ${n} කට පෙර`;
  return `${n} ${EN[found.unit]} ago`;
}
