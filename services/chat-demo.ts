import AsyncStorage from '@react-native-async-storage/async-storage';

import { newId } from '@/lib/id';
import type { Message, OfferStatus, ReportReason, UpdateKind } from '@/lib/chat-types';
import { demoSellerDecision } from '@/lib/offers';

import { loadDemoListings } from './demo-store';

// Local stand-in for chat while Supabase isn't configured. The seller is a bot that answers the buyer.

export type DemoThread = {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  createdAt: string;
  myReadAt: string;
  muted: boolean;
};

export type DemoUpdate = { id: string; kind: UpdateKind; threadId: string; actorId: string; body: string | null; read: boolean; createdAt: string };

export type DemoDB = {
  threads: DemoThread[];
  messages: Message[];
  updates: DemoUpdate[];
  blocked: string[];
  /** Items the demo seller "sold" to this user, waiting for a review. */
  reviewable: { listingId: string; sellerId: string }[];
  /** Listing ids this user has already reviewed. */
  reviewed: string[];
  reports: { targetId: string; reason: ReportReason; details: string | null }[];
};

const key = (userId: string) => `sih.demo.chat.${userId}`;
const cache = new Map<string, DemoDB>();
const listeners = new Set<(threadId: string | null) => void>();

export function subscribeDemo(cb: (threadId: string | null) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
const emit = (threadId: string | null) => listeners.forEach((l) => l(threadId));

export async function loadDb(userId: string): Promise<DemoDB> {
  const hit = cache.get(userId);
  if (hit) return hit;
  let db: DemoDB = { threads: [], messages: [], updates: [], blocked: [], reviewable: [], reviewed: [], reports: [] };
  try {
    const raw = await AsyncStorage.getItem(key(userId));
    if (raw) db = { ...db, ...(JSON.parse(raw) as Partial<DemoDB>) };
  } catch {
    // start empty
  }
  cache.set(userId, db);
  return db;
}

export async function saveDb(userId: string, db: DemoDB, threadId: string | null = null): Promise<void> {
  cache.set(userId, db);
  await AsyncStorage.setItem(key(userId), JSON.stringify(db)).catch(() => {});
  emit(threadId);
}

export function demoMessage(threadId: string, senderId: string | null, kind: Message['kind'], extra: Partial<Message> = {}): Message {
  return { id: newId(), threadId, senderId, kind, body: null, imagePath: null, meta: {}, offerStatus: null, createdAt: new Date().toISOString(), ...extra };
}

export function demoUpdate(db: DemoDB, kind: UpdateKind, thread: DemoThread, actorId: string, body: string | null = null) {
  db.updates.unshift({ id: newId(), kind, threadId: thread.id, actorId, body, read: false, createdAt: new Date().toISOString() });
}

export function setOfferStatus(db: DemoDB, messageId: string, status: OfferStatus) {
  const m = db.messages.find((x) => x.id === messageId);
  if (m) m.offerStatus = status;
}

/** The bot seller answers a buyer's message after a short pause. */
export function scheduleBotReply(userId: string, trigger: Message): void {
  setTimeout(async () => {
    const db = await loadDb(userId);
    const thread = db.threads.find((t) => t.id === trigger.threadId);
    if (!thread || db.blocked.includes(thread.sellerId)) return;
    const listing = (await loadDemoListings()).find((l) => l.id === thread.listingId);
    const reply = (m: Message, kind: UpdateKind, body: string | null = null) => {
      db.messages.push(m);
      demoUpdate(db, kind, thread, thread.sellerId, body);
    };

    if (trigger.kind === 'text') {
      const text = trigger.body ?? '';
      const answer = /available|still|متوفر|موجود/i.test(text)
        ? "Hi! Yes, it's still available."
        : /price|best|offer|سعر|آخر/i.test(text)
          ? 'The price is on the listing, but send me an offer and I will have a look.'
          : 'Thanks for your message! When would you like to see it?';
      reply(demoMessage(thread.id, thread.sellerId, 'text', { body: answer }), 'message', answer);
    } else if (trigger.kind === 'image') {
      reply(demoMessage(thread.id, thread.sellerId, 'text', { body: 'Thanks for the photo!' }), 'message', 'Thanks for the photo!');
    } else if (trigger.kind === 'meetup') {
      reply(demoMessage(thread.id, thread.sellerId, 'text', { body: 'That time works for me. See you there!' }), 'message', 'That time works for me. See you there!');
    } else if (trigger.kind === 'offer' && listing) {
      const amount = Number(trigger.meta.amount_minor);
      const decision = demoSellerDecision(amount, listing.priceMinor, listing.currency);
      if (decision.action === 'counter') {
        setOfferStatus(db, trigger.id, 'countered');
        reply(
          demoMessage(thread.id, thread.sellerId, 'offer', { meta: { amount_minor: decision.amountMinor, currency: listing.currency }, offerStatus: 'pending' }),
          'offer',
        );
      } else {
        const accepted = decision.action === 'accept';
        setOfferStatus(db, trigger.id, accepted ? 'accepted' : 'declined');
        reply(
          demoMessage(thread.id, null, 'system', { meta: { event: accepted ? 'offer_accepted' : 'offer_declined', amount_minor: amount, currency: listing.currency } }),
          accepted ? 'offer_accepted' : 'offer_declined',
        );
        if (accepted) scheduleReviewRequest(userId, thread, listing.id);
      }
    }
    await saveDb(userId, db, thread.id);
  }, 1200);
}

/** A little after accepting an offer the demo seller marks the item sold to the buyer, which asks for a review. */
function scheduleReviewRequest(userId: string, thread: DemoThread, listingId: string): void {
  setTimeout(async () => {
    const db = await loadDb(userId);
    if (db.reviewable.some((r) => r.listingId === listingId) || db.reviewed.includes(listingId)) return;
    db.reviewable.push({ listingId, sellerId: thread.sellerId });
    demoUpdate(db, 'review_request', thread, thread.sellerId);
    await saveDb(userId, db, thread.id);
  }, 2500);
}
