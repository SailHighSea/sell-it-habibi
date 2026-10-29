import data from '../supabase/functions/_shared/prohibited.json';

import type { CountryCode } from '@/constants/countries';
import type { Language } from '@/i18n';

import { normalizeSearch } from './arabic';

export type Severity = 'block' | 'warn';

export type ProhibitedRule = {
  id: string;
  severity: Severity;
  countries: string[];
  label: Record<Language, string>;
  keywords: Record<Language, string[]>;
};

const RULES = data.rules as ProhibitedRule[];

/** Words and numbers only, Arabic spellings folded together, with ":" kept so "1:1" survives. */
function squash(text: string): string {
  return ` ${normalizeSearch(text).replace(/[^\p{L}\p{N}:]+/gu, ' ').trim()} `;
}

const PREPARED = RULES.map((rule) => ({
  rule,
  keywords: [...rule.keywords.en, ...rule.keywords.ar].map((k) => squash(k)).filter((k) => k.trim().length > 0),
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

export const ruleLabel = (rule: ProhibitedRule, language: Language) => rule.label[language];
