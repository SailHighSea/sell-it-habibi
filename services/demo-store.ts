import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Listing, Seller } from '@/lib/listing-types';

// Local stand-in for the database while Supabase isn't configured. Never used when it is.

const KEY = 'sih.demo.listings.v2';

const SELLERS: Seller[] = [
  { id: 'demo-seller-maya', displayName: 'Maya K.', avatarUrl: null, phoneVerified: true, city: 'Dubai Marina' },
  { id: 'demo-seller-omar', displayName: 'Omar S.', avatarUrl: null, phoneVerified: true, city: 'Sharjah' },
  { id: 'demo-seller-layla', displayName: 'Layla A.', avatarUrl: null, phoneVerified: false, city: 'Abu Dhabi' },
];

type Seed = [title: string, price: number, cat: string, cond: Listing['condition'], city: string, seller: number, hoursAgo: number, likes: number, extra?: Partial<Listing>];

const SEEDS: Seed[] = [
  ['iPhone 15 Pro 256GB', 3200, 'smartphones', 'like_new', 'Dubai Marina', 0, 2, 12, { attributes: { brand: 'Apple', storage: '256GB' }, description: '• Natural titanium, battery health 94%\n• Box, cable and case included' }],
  ['Toyota Land Cruiser 2019', 145000, 'used-cars', 'used', 'Abu Dhabi', 2, 26, 7, { attributes: { year: 2019, mileage: 82000, transmission: 'automatic' }, description: 'GCC specs, full service history.' }],
  ['Majlis floor sofa set', 1800, 'sofas-majlis', 'used', 'Sharjah', 1, 3, 4],
  ['PlayStation 5 + 2 controllers', 1650, 'gaming', 'like_new', 'Jumeirah', 0, 5, 9, { dealMethods: ['meetup', 'delivery'] }],
  ['Designer abaya, size M', 450, 'abayas-modest', 'like_new', 'Al Ain', 2, 6, 3, { attributes: { size: 'M' } }],
  ['Mountain bike, barely used', 900, 'bikes', 'like_new', 'Dubai Hills', 1, 30, 1],
  ['Kids study desk', 250, 'baby-gear', 'used', 'Ajman', 1, 50, 0],
  ['MacBook Air M2', 3900, 'computers-laptops', 'like_new', 'Business Bay', 0, 8, 15, { attributes: { brand: 'Apple' } }],
  ['Free: moving boxes, 20 pieces', 0, 'tables-chairs', 'used', 'Dubai Marina', 0, 4, 2, { type: 'free', dealMethods: ['meetup'] }],
  ['شقة غرفتين وصالة للإيجار', 62000, 'property-rent', 'used', 'Sharjah', 1, 12, 5, { attributes: { bedrooms: 2, area: 110 } }],
  ['Free: baby cot, good condition', 0, 'baby-gear', 'used', 'Abu Dhabi', 2, 20, 6, { type: 'free' }],
  ['Samsung 55" QLED TV', 1400, 'tv-audio', 'used', 'Dubai Marina', 0, 70, 2],
];

function buildSeed(now = Date.now()): Listing[] {
  return SEEDS.map(([title, price, cat, condition, city, seller, hoursAgo, likes, extra], i) => {
    const at = new Date(now - hoursAgo * 3_600_000).toISOString();
    return {
      id: `demo-listing-${i + 1}`,
      sellerId: SELLERS[seller].id,
      seller: SELLERS[seller],
      title,
      description: null,
      priceMinor: price * 100,
      currency: 'AED',
      condition,
      type: 'sale',
      categorySlug: cat,
      country: 'AE',
      city,
      status: 'active',
      attributes: {},
      fixedPrice: false,
      preOrder: false,
      dealMethods: ['meetup'],
      imagePaths: [],
      favoriteCount: likes,
      createdAt: at,
      bumpedAt: at,
      ...extra,
    } as Listing;
  });
}

let cache: Listing[] | null = null;

export async function loadDemoListings(): Promise<Listing[]> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Listing[]) : null;
  } catch {
    cache = null;
  }
  if (!cache) {
    cache = buildSeed();
    await AsyncStorage.setItem(KEY, JSON.stringify(cache)).catch(() => {});
  }
  return cache;
}

export async function saveDemoListings(listings: Listing[]): Promise<void> {
  cache = listings;
  await AsyncStorage.setItem(KEY, JSON.stringify(listings)).catch(() => {});
}

export async function mutateDemoListing(id: string, fn: (l: Listing) => Listing): Promise<Listing> {
  const all = await loadDemoListings();
  const index = all.findIndex((l) => l.id === id);
  if (index < 0) throw new Error('not_found');
  const next = fn(all[index]);
  await saveDemoListings(all.map((l, i) => (i === index ? next : l)));
  return next;
}

export function demoSeller(id: string): Seller | undefined {
  return SELLERS.find((s) => s.id === id);
}
