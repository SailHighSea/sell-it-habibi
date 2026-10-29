import { formatNumber } from './intl';

/** "4.8" for display; null ratings (no reviews yet) give an empty string. */
export function formatRating(avg: number | null, locale = 'en'): string {
  return avg === null ? '' : formatNumber(avg, locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }, () => avg.toFixed(1));
}

/** New average after one more review (used by demo mode; the database does this with a trigger). */
export function addRating(avg: number | null, count: number, rating: number): { avg: number; count: number } {
  const total = (avg ?? 0) * count + rating;
  return { avg: Math.round((total / (count + 1)) * 100) / 100, count: count + 1 };
}
