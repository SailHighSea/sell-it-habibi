import { DEFAULT_CURRENCY } from '@/constants/theme';

export type Listing = {
  id: string;
  title: string;
  price: number;
  currency: string;
  location: string;
  category: string;
};

export const CATEGORIES = ['Cars', 'Phones', 'Furniture', 'Fashion', 'Electronics', 'Property', 'Kids', 'Sports'];

const MOCK: Listing[] = [
  { id: '1', title: 'iPhone 15 Pro 256GB', price: 3200, currency: DEFAULT_CURRENCY, location: 'Dubai Marina', category: 'Phones' },
  { id: '2', title: 'Toyota Land Cruiser 2019', price: 145000, currency: DEFAULT_CURRENCY, location: 'Abu Dhabi', category: 'Cars' },
  { id: '3', title: 'Majlis floor sofa set', price: 1800, currency: DEFAULT_CURRENCY, location: 'Sharjah', category: 'Furniture' },
  { id: '4', title: 'PlayStation 5 + 2 controllers', price: 1650, currency: DEFAULT_CURRENCY, location: 'Jumeirah', category: 'Electronics' },
  { id: '5', title: 'Designer abaya, size M', price: 450, currency: DEFAULT_CURRENCY, location: 'Al Ain', category: 'Fashion' },
  { id: '6', title: 'Mountain bike, barely used', price: 900, currency: DEFAULT_CURRENCY, location: 'Dubai Hills', category: 'Sports' },
  { id: '7', title: 'Kids study desk', price: 250, currency: DEFAULT_CURRENCY, location: 'Ajman', category: 'Kids' },
  { id: '8', title: 'MacBook Air M2', price: 3900, currency: DEFAULT_CURRENCY, location: 'Business Bay', category: 'Electronics' },
];

/**
 * Placeholder data source. Swap the body for a real backend call (e.g. Supabase)
 * without touching any screen code.
 */
export async function fetchListings(): Promise<Listing[]> {
  return MOCK;
}
