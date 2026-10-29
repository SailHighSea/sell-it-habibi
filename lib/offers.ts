import type { ListingStatus, ListingType } from './listing-types';
import { minorDigits } from './money';

type OfferTarget = { type: ListingType; status: ListingStatus; fixedPrice: boolean; priceMinor: number };

export type OfferError = 'free' | 'unavailable' | 'invalid' | 'fixed';

/** Same rules as the database function `send_offer`. Returns why an offer can't be made, or null. */
export function checkOffer(amountMinor: number | null, listing: OfferTarget): OfferError | null {
  if (listing.type === 'free') return 'free';
  if (listing.status !== 'active') return 'unavailable';
  if (amountMinor === null || !Number.isInteger(amountMinor) || amountMinor <= 0) return 'invalid';
  if (listing.fixedPrice && amountMinor !== listing.priceMinor) return 'fixed';
  return null;
}

export function canMakeOffer(listing: OfferTarget): boolean {
  return listing.type !== 'free' && listing.status === 'active';
}

/** Counter-offers aren't allowed on fixed-price listings. */
export function canCounter(listing: OfferTarget): boolean {
  return canMakeOffer(listing) && !listing.fixedPrice;
}

/** One-tap offer amounts: 90%, 80% and 70% of the asking price, rounded to a tidy number of whole currency units. */
export function suggestOffers(priceMinor: number, currency: string): number[] {
  const unit = 10 ** minorDigits(currency);
  const major = priceMinor / unit;
  const step = (major >= 1000 ? 50 : major >= 100 ? 10 : 5) * unit;
  const out = [0.9, 0.8, 0.7].map((pct) => Math.round((priceMinor * pct) / step) * step).filter((v) => v > 0 && v < priceMinor);
  return [...new Set(out)];
}

export type Decision = { action: 'accept' } | { action: 'decline' } | { action: 'counter'; amountMinor: number };

/** What the demo seller does with an offer. Only used when no server is connected. */
export function demoSellerDecision(offerMinor: number, priceMinor: number, currency: string): Decision {
  const ratio = offerMinor / priceMinor;
  if (ratio >= 0.9) return { action: 'accept' };
  if (ratio >= 0.7) {
    const unit = 10 ** minorDigits(currency);
    return { action: 'counter', amountMinor: Math.max(offerMinor + unit, Math.round((priceMinor * 0.95) / unit) * unit) };
  }
  return { action: 'decline' };
}
