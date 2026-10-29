import AsyncStorage from '@react-native-async-storage/async-storage';

import { newId } from '@/lib/id';
import type { Seller } from '@/lib/listing-types';
import { addRating } from '@/lib/rating';
import { SELLER_COLUMNS, sellerFromRow } from '@/lib/seller';
import { supabase } from '@/lib/supabase';

import { loadDb, saveDb } from './chat-demo';
import { loadDemoListings, mutateDemoListing, saveDemoListings } from './demo-store';

export type Review = {
  id: string;
  listingTitle: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: { id: string; displayName: string | null; avatarUrl: string | null } | null;
};

export type ReviewState = {
  /** The signed-in person was marked as the buyer and hasn't reviewed yet. */
  canReview: boolean;
  reviewed: boolean;
  sellerId: string | null;
  sellerName: string | null;
  listingTitle: string | null;
};

const DEMO_REVIEWS = 'sih.demo.reviews.v1';

type DemoReview = Review & { sellerId: string };

function seedReviews(): DemoReview[] {
  const day = 86_400_000;
  const at = (days: number) => new Date(Date.now() - days * day).toISOString();
  const by = (id: string, displayName: string) => ({ id, displayName, avatarUrl: null });
  return [
    { id: 'demo-review-1', sellerId: 'demo-seller-maya', listingTitle: 'iPad Air 2022', rating: 5, comment: 'Exactly as described and easy to meet. Thank you!', createdAt: at(6), reviewer: by('r1', 'Noor H.') },
    { id: 'demo-review-2', sellerId: 'demo-seller-maya', listingTitle: 'Nintendo Switch', rating: 5, comment: null, createdAt: at(19), reviewer: by('r2', 'Faisal T.') },
    { id: 'demo-review-3', sellerId: 'demo-seller-maya', listingTitle: 'Desk lamp', rating: 4, comment: 'Good seller, slightly late but told me in advance.', createdAt: at(41), reviewer: by('r3', 'Aisha K.') },
    { id: 'demo-review-4', sellerId: 'demo-seller-omar', listingTitle: 'Coffee table', rating: 5, comment: 'Smooth deal.', createdAt: at(11), reviewer: by('r4', 'Sara M.') },
    { id: 'demo-review-5', sellerId: 'demo-seller-omar', listingTitle: 'Bookshelf', rating: 4, comment: 'Item was a bit more worn than the photos, but fair price.', createdAt: at(30), reviewer: by('r5', 'Hamad A.') },
  ];
}

async function loadDemoReviews(): Promise<DemoReview[]> {
  try {
    const raw = await AsyncStorage.getItem(DEMO_REVIEWS);
    if (raw) return JSON.parse(raw) as DemoReview[];
  } catch {
    // fall through to the seed
  }
  const seeded = seedReviews();
  await AsyncStorage.setItem(DEMO_REVIEWS, JSON.stringify(seeded)).catch(() => {});
  return seeded;
}

// ---------------------------------------------------------------- reading
export async function listReviews(sellerId: string, limit = 20): Promise<Review[]> {
  if (!supabase) {
    return (await loadDemoReviews()).filter((r) => r.sellerId === sellerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
  }
  const { data, error } = await supabase
    .from('reviews')
    .select('id,listing_title,rating,comment,created_at,reviewer:profiles!reviewer_id(id,display_name,avatar_url)')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  type Row = { id: string; listing_title: string; rating: number; comment: string | null; created_at: string; reviewer: { id: string; display_name: string | null; avatar_url: string | null } | null };
  return (data as unknown as Row[]).map((r) => ({
    id: r.id, listingTitle: r.listing_title, rating: r.rating, comment: r.comment, createdAt: r.created_at,
    reviewer: r.reviewer ? { id: r.reviewer.id, displayName: r.reviewer.display_name, avatarUrl: r.reviewer.avatar_url } : null,
  }));
}

export async function getReviewState(userId: string, listingId: string): Promise<ReviewState> {
  const none: ReviewState = { canReview: false, reviewed: false, sellerId: null, sellerName: null, listingTitle: null };
  if (!supabase) {
    const db = await loadDb(userId);
    const listing = (await loadDemoListings()).find((l) => l.id === listingId);
    const reviewed = db.reviewed.includes(listingId);
    const eligible = db.reviewable.some((r) => r.listingId === listingId);
    return { canReview: eligible && !reviewed, reviewed, sellerId: listing?.sellerId ?? null, sellerName: listing?.seller?.displayName ?? null, listingTitle: listing?.title ?? null };
  }
  const [listing, review] = await Promise.all([
    supabase.from('listings').select('id,title,sold_to,seller_id,seller:profiles(display_name)').eq('id', listingId).maybeSingle(),
    supabase.from('reviews').select('id').eq('listing_id', listingId).maybeSingle(),
  ]);
  if (listing.error) throw listing.error;
  const l = listing.data as unknown as { title: string; sold_to: string | null; seller_id: string; seller: { display_name: string | null } | null } | null;
  if (!l) return none;
  const reviewed = !!review.data;
  return { canReview: l.sold_to === userId && !reviewed, reviewed, sellerId: l.seller_id, sellerName: l.seller?.display_name ?? null, listingTitle: l.title };
}

// ---------------------------------------------------------------- writing
/** Throws `not_your_purchase`, `invalid_rating` or `already_reviewed` (the database enforces all three). */
export async function submitReview(userId: string, listingId: string, rating: number, comment: string): Promise<void> {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('invalid_rating');
  const text = comment.trim().slice(0, 500) || null;
  if (!supabase) {
    const state = await getReviewState(userId, listingId);
    if (state.reviewed) throw new Error('already_reviewed');
    if (!state.canReview || !state.sellerId) throw new Error('not_your_purchase');
    const reviews = await loadDemoReviews();
    reviews.push({ id: newId(), sellerId: state.sellerId, listingTitle: state.listingTitle ?? '', rating, comment: text, createdAt: new Date().toISOString(), reviewer: { id: userId, displayName: 'You', avatarUrl: null } });
    await AsyncStorage.setItem(DEMO_REVIEWS, JSON.stringify(reviews)).catch(() => {});
    // The seller's average moves, as the database trigger would do it.
    const listings = await loadDemoListings();
    await saveDemoListings(
      listings.map((l) => {
        if (l.sellerId !== state.sellerId || !l.seller) return l;
        const next = addRating(l.seller.ratingAvg, l.seller.ratingCount, rating);
        return { ...l, seller: { ...l.seller, ratingAvg: next.avg, ratingCount: next.count } };
      }),
    );
    const db = await loadDb(userId);
    db.reviewed.push(listingId);
    await saveDb(userId, db, null);
    return;
  }
  const { error } = await supabase.rpc('submit_review', { p_listing: listingId, p_rating: rating, p_comment: text });
  if (error) throw new Error(error.message);
}

/** People who messaged the seller about this item, i.e. who can be named as the buyer. */
export async function listBuyerCandidates(listingId: string): Promise<Seller[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('threads').select(`buyer:profiles!buyer_id(${SELLER_COLUMNS})`).eq('listing_id', listingId);
  if (error) throw error;
  const seen = new Set<string>();
  return (data as unknown as { buyer: Parameters<typeof sellerFromRow>[0] | null }[]).flatMap((r) => {
    if (!r.buyer || seen.has(r.buyer.id)) return [];
    seen.add(r.buyer.id);
    return [sellerFromRow(r.buyer)];
  });
}

/** Marks the item sold. With a buyer, that person is asked for a review. Throws `not_a_buyer` if they never chatted about it. */
export async function markSold(listingId: string, buyerId: string | null): Promise<void> {
  if (!supabase) {
    await mutateDemoListing(listingId, (l) => ({ ...l, status: 'sold', soldTo: buyerId }));
    return;
  }
  const { error } = await supabase.rpc('mark_sold', { p_listing: listingId, p_buyer: buyerId });
  if (error) throw new Error(error.message);
}
