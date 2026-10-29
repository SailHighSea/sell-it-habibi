import type { Seller } from './listing-types';

/** Public profile columns every query for a seller or conversation partner asks for. */
export const SELLER_COLUMNS = 'id,display_name,avatar_url,phone_verified,city,rating_avg,rating_count';

export type SellerRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  phone_verified: boolean;
  city: string | null;
  rating_avg?: number | string | null;
  rating_count?: number | null;
};

export function sellerFromRow(r: SellerRow): Seller {
  return {
    id: r.id,
    displayName: r.display_name,
    avatarUrl: r.avatar_url,
    phoneVerified: r.phone_verified,
    city: r.city,
    ratingAvg: r.rating_avg === null || r.rating_avg === undefined ? null : Number(r.rating_avg),
    ratingCount: r.rating_count ?? 0,
  };
}
