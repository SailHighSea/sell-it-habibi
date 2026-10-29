import type { CountryCode } from '@/constants/countries';

export type Condition = 'new' | 'like_new' | 'used';
export type DealMethod = 'meetup' | 'delivery' | 'cod';
export type ListingStatus = 'active' | 'inactive' | 'sold' | 'removed';
export type ListingType = 'sale' | 'free';

export const CONDITIONS: Condition[] = ['new', 'like_new', 'used'];
export const DEAL_METHODS: DealMethod[] = ['meetup', 'delivery', 'cod'];

export type Seller = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  phoneVerified: boolean;
  city: string | null;
  /** Average of the reviews, or null when there are none. */
  ratingAvg: number | null;
  ratingCount: number;
};

export type Listing = {
  id: string;
  sellerId: string;
  seller?: Seller;
  title: string;
  description: string | null;
  /** Integer minor units (fils for AED). Zero for free items. */
  priceMinor: number;
  currency: string;
  condition: Condition;
  type: ListingType;
  /** Leaf (or top-level) category slug. */
  categorySlug: string;
  country: CountryCode;
  city: string | null;
  /** Approximate pin (never the exact address), or null for older listings. */
  lat: number | null;
  lng: number | null;
  status: ListingStatus;
  attributes: Record<string, string | number>;
  fixedPrice: boolean;
  preOrder: boolean;
  dealMethods: DealMethod[];
  /** Storage paths, or full URIs for local/demo photos. First is the cover. */
  imagePaths: string[];
  favoriteCount: number;
  /** Who the seller marked it sold to (the person who may review), if anyone. */
  soldTo: string | null;
  createdAt: string;
  bumpedAt: string;
};

export type SortKey = 'newest' | 'priceAsc' | 'priceDesc' | 'popular' | 'nearest' | 'relevance';
export type FeedTab = 'forYou' | 'top' | 'nearby' | 'free' | 'following';

export type ListingQuery = {
  /** Omit to search every country (e.g. a seller's own listings). */
  country?: CountryCode;
  text?: string;
  category?: string;
  minPriceMinor?: number;
  maxPriceMinor?: number;
  conditions?: Condition[];
  city?: string;
  /** Only listings within `radiusKm` of this point. Sorting by `nearest` uses the same point. */
  near?: { lat: number; lng: number; radiusKm: number };
  freeOnly?: boolean;
  sort?: SortKey;
  sellerId?: string;
  /** Match any of these sellers (used by the Following tab). */
  sellerIds?: string[];
  /** Defaults to active. `all` is for a seller's own manage screen. */
  status?: ListingStatus | 'all';
  limit?: number;
  /** Skip this many results (paging). */
  offset?: number;
};

/** What a user can save: everything except where it runs. */
export type SavedQuery = Omit<ListingQuery, 'country' | 'sellerId' | 'sellerIds' | 'status' | 'limit' | 'offset' | 'near'> & {
  /** Search radius; the centre is wherever the person is browsing from when they open the search. */
  radiusKm?: number;
};

export type SavedSearch = { id: string; name: string; query: SavedQuery };

/** New or edited listing as the form produces it. `photos` are storage paths or local URIs, already in display order. */
export type ListingInput = {
  title: string;
  description: string | null;
  priceMinor: number;
  currency: string;
  condition: Condition;
  type: ListingType;
  categorySlug: string;
  country: CountryCode;
  city: string | null;
  attributes: Record<string, string | number>;
  fixedPrice: boolean;
  preOrder: boolean;
  dealMethods: DealMethod[];
};
