import data from '../supabase/functions/_shared/prohibited.json';

import type { CountryCode } from '@/constants/countries';
import type { Language } from '@/i18n';

import { normalizeSearch } from './arabic';

export type Severity = 'block' | 'warn';

export type ProhibitedRule = {
  id: string;
  severity: Severity;
  countries: string[];
  label: Record<"en" | "ar", string> & { si?: string };
  keywords: Record<"en" | "ar", string[]> & { si?: string[] };
};

const RULES = data.rules as ProhibitedRule[];

/** Letters and numbers only (Latin and Arabic), Arabic spellings folded together, with ":" kept so "1:1" survives. */
// An explicit character range instead of a Unicode property escape, which not every JavaScript engine handles well.
function squash(text: string): string {
  return ` ${normalizeSearch(text).replace(/[^a-z0-9\u00c0-\u024f\u0600-\u06ff\u0d80-\u0dff\u200d:]+/g, ' ').trim()} `;
}

const PREPARED = RULES.map((rule) => ({
  rule,
  keywords: [...rule.keywords.en, ...rule.keywords.ar, ...(rule.keywords.si ?? [])].map((k) => squash(k)).filter((k) => k.trim().length > 0),
}));

export type ProhibitedResult = { blocked: ProhibitedRule[]; warned: ProhibitedRule[] };

/** Which rules apply to this text in this country. Whole words only, so "gunmetal" does not match "gun". */
export function checkProhibited(text: string, country: CountryCode): ProhibitedResult {
  const haystack = squash(text);
  const blocked: ProhibitedRule[] = [];
  const warned: ProhibitedRule[] = [];
  for (const { rule, keywords } of PREPARED) {
    if (!rule.countries.includes(country)) continue;
    if (!keywords.some((k) => haystack.includes(k))) continue;
    (rule.severity === 'block' ? blocked : warned).push(rule);
  }
  return { blocked, warned };
}

export const ruleLabel = (rule: ProhibitedRule, language: Language) => (rule.label as Record<string, string>)[language] ?? rule.label.en;
