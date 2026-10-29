import type { ListingStatus, ListingType, Seller } from './listing-types';

export type MessageKind = 'text' | 'image' | 'offer' | 'meetup' | 'system';
export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'countered';
export type ReportReason = 'scam' | 'spam' | 'abusive' | 'prohibited' | 'other';
export const REPORT_REASONS: ReportReason[] = ['scam', 'spam', 'abusive', 'prohibited', 'other'];

export type Message = {
  id: string;
  threadId: string;
  /** Null for system messages ("offer accepted"). */
  senderId: string | null;
  kind: MessageKind;
  body: string | null;
  imagePath: string | null;
  /** offer: { amount_minor, currency }. meetup: { place, at }. system: { event, amount_minor, currency }. */
  meta: Record<string, unknown>;
  offerStatus: OfferStatus | null;
  createdAt: string;
};

export type ThreadListing = {
  id: string;
  title: string;
  priceMinor: number;
  currency: string;
  imagePath: string | null;
  status: ListingStatus;
  type: ListingType;
  fixedPrice: boolean;
};

export type Thread = {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  iAmSeller: boolean;
  other: Seller | null;
  listing: ThreadListing | null;
  lastMessageAt: string;
  lastKind: MessageKind;
  /** Text of the last message; empty for photos, offers and meet-ups. */
  lastPreview: string;
  unread: number;
  muted: boolean;
};

export type UpdateKind = 'message' | 'offer' | 'offer_accepted' | 'offer_declined' | 'meetup' | 'review_request' | 'review' | 'moderation';

export type UpdateItem = {
  id: string;
  kind: UpdateKind;
  threadId: string | null;
  listingId: string | null;
  listingTitle: string | null;
  actor: Seller | null;
  body: string | null;
  read: boolean;
  createdAt: string;
};
