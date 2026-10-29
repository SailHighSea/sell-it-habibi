import type { CountryCode } from '@/constants/countries';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export type Listing = {
  id: string;
  title: string;
  /** Integer minor units (fils for AED). */
  priceMinor: number;
  currency: string;
  location: string;
  /** Category slug; translate with `cat.<slug>`. */
  category: string;
};

export const CATEGORIES = ['cars', 'phones', 'furniture', 'fashion', 'electronics', 'property', 'kids', 'sports'] as const;

const MOCK: Listing[] = [
  { id: '1', title: 'iPhone 15 Pro 256GB', priceMinor: 320000, currency: 'AED', location: 'Dubai Marina', category: 'phones' },
  { id: '2', title: 'Toyota Land Cruiser 2019', priceMinor: 14500000, currency: 'AED', location: 'Abu Dhabi', category: 'cars' },
  { id: '3', title: 'Majlis floor sofa set', priceMinor: 180000, currency: 'AED', location: 'Sharjah', category: 'furniture' },
  { id: '4', title: 'PlayStation 5 + 2 controllers', priceMinor: 165000, currency: 'AED', location: 'Jumeirah', category: 'electronics' },
  { id: '5', title: 'Designer abaya, size M', priceMinor: 45000, currency: 'AED', location: 'Al Ain', category: 'fashion' },
  { id: '6', title: 'Mountain bike, barely used', priceMinor: 90000, currency: 'AED', location: 'Dubai Hills', category: 'sports' },
  { id: '7', title: 'Kids study desk', priceMinor: 25000, currency: 'AED', location: 'Ajman', category: 'kids' },
  { id: '8', title: 'MacBook Air M2', priceMinor: 390000, currency: 'AED', location: 'Business Bay', category: 'electronics' },
];

type Row = { id: string; title: string; price_minor: number; currency: string; city: string | null; category_slug: string };

/** Active listings in a country, newest first. Uses sample data until Supabase is configured. */
export async function fetchListings(country: CountryCode): Promise<Listing[]> {
  if (!isSupabaseConfigured || !supabase) return MOCK;
  const { data, error } = await supabase
    .from('listings')
    .select('id,title,price_minor,currency,city,category_slug')
    .eq('status', 'active')
    .eq('country', country)
    .order('created_at', { ascending: false })
    .limit(40);
  if (error) throw error;
  return (data as Row[]).map((r) => ({
    id: r.id,
    title: r.title,
    priceMinor: r.price_minor,
    currency: r.currency,
    location: r.city ?? '',
    category: r.category_slug,
  }));
}
