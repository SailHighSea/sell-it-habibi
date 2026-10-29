import { normalizeSearch } from './arabic';

// An explicit character class: Hermes (the Android JS engine) must not be given Unicode property escapes.
const WORD_BREAK = /[\s\-.,;:!?()"'/\\|+*&%$#@^~_=<>[\]{}\u060C\u061B\u061F]+/;

/** Edit distance, stopping early once it exceeds `max`. */
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      cur.push(v);
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/** How many typos a search word of this length may have: none under 4 letters, one up to 7, two beyond. */
export const allowedTypos = (len: number) => (len < 4 ? 0 : len < 8 ? 1 : 2);

/** True when the token is inside the text, or within the allowed typos of one of its words (or a same-length prefix of one). */
export function fuzzyIncludes(haystackNormalized: string, token: string): boolean {
  if (haystackNormalized.includes(token)) return true;
  const max = allowedTypos(token.length);
  if (max === 0) return false;
  for (const word of haystackNormalized.split(WORD_BREAK).filter(Boolean)) {
    if (editDistance(token, word, max) <= max) return true;
    if (word.length > token.length && editDistance(token, word.slice(0, token.length), max) <= max) return true;
  }
  return false;
}

/** Higher is a better match: whole-word and title hits beat description hits, prefixes beat middles. */
export function relevanceScore(title: string, description: string | null, tokens: string[]): number {
  const t = normalizeSearch(title);
  const d = normalizeSearch(description ?? '');
  const titleWords = t.split(WORD_BREAK).filter(Boolean);
  let score = 0;
  for (const token of tokens) {
    if (titleWords.includes(token)) score += 6;
    else if (titleWords.some((w) => w.startsWith(token))) score += 4;
    else if (t.includes(token)) score += 3;
    else if (d.includes(token)) score += 1;
    else score += 0.5; // matched only through the typo allowance
  }
  if (t.startsWith(tokens[0] ?? '\u0000')) score += 1;
  return score;
}
