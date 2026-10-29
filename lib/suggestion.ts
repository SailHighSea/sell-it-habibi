import { isCategorySlug } from '@/constants/categories';

import { CONDITIONS, type Condition } from './listing-types';

export type PhotoSuggestion = {
  title: string;
  categorySlug: string | null;
  condition: Condition;
  bulletPoints: string[];
  descriptionCasual: string;
  descriptionShort: string;
  /** Estimated price range in whole currency units, only when the model was confident. */
  priceMin: number | null;
  priceMax: number | null;
};

const clip = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < 10_000_000 ? v : null);

/** The AI response is untrusted input (it can echo text from the photo). Keep only values the form can safely show. */
export function sanitizeSuggestion(raw: unknown): PhotoSuggestion {
  const r = (raw ?? {}) as Record<string, unknown>;
  const slug = clip(r.category_slug ?? r.categorySlug, 40);
  const condition = CONDITIONS.includes(r.condition as Condition) ? (r.condition as Condition) : 'used';
  const bullets = Array.isArray(r.bullet_points ?? r.bulletPoints) ? ((r.bullet_points ?? r.bulletPoints) as unknown[]) : [];
  const priceMin = num(r.price_min ?? r.priceMin);
  const priceMax = num(r.price_max ?? r.priceMax);
  const ordered = priceMin !== null && priceMax !== null && priceMin <= priceMax;
  return {
    title: clip(r.title, 120),
    categorySlug: isCategorySlug(slug) ? slug : null,
    condition,
    bulletPoints: bullets.map((b) => clip(b, 160)).filter(Boolean).slice(0, 6),
    descriptionCasual: clip(r.description_casual ?? r.descriptionCasual, 1000),
    descriptionShort: clip(r.description_short ?? r.descriptionShort, 300),
    priceMin: ordered ? priceMin : null,
    priceMax: ordered ? priceMax : null,
  };
}
