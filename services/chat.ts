import { getDeviceId } from '@/lib/device-id';
import { newId } from '@/lib/id';
import type { Message, MessageKind, OfferStatus, ReportReason, Thread, ThreadListing } from '@/lib/chat-types';
import type { Seller } from '@/lib/listing-types';
import { checkOffer } from '@/lib/offers';
import { SELLER_COLUMNS, sellerFromRow, type SellerRow } from '@/lib/seller';
import { supabase } from '@/lib/supabase';

import { addDemoReport } from './moderation';
import { demoMessage, demoUpdate, loadDb, saveDb, scheduleBotReply, setOfferStatus, subscribeDemo } from './chat-demo';
import { loadDemoListings } from './demo-store';
import { getSeller } from './profile';

const CHAT_BUCKET = 'chat-images';

type MessageRow = {
  id: string; thread_id: string; sender_id: string | null; kind: MessageKind; body: string | null; image_path: string | null;
  meta: Record<string, unknown> | null; offer_status: OfferStatus | null; created_at: string;
};

export function messageFromRow(r: MessageRow): Message {
  return { id: r.id, threadId: r.thread_id, senderId: r.sender_id, kind: r.kind, body: r.body, imagePath: r.image_path, meta: r.meta ?? {}, offerStatus: r.offer_status, createdAt: r.created_at };
}

const THREAD_SELECT =
  '*, listing:listings(id,title,price_minor,currency,image_paths,status,type,fixed_price), buyer:profiles!buyer_id(' + SELLER_COLUMNS + '), seller:profiles!seller_id(' + SELLER_COLUMNS + ')';

type ThreadRow = {
  id: string; listing_id: string; buyer_id: string; seller_id: string; created_at: string; last_message_at: string; last_kind: MessageKind; last_preview: string;
  buyer_muted: boolean; seller_muted: boolean; buyer: SellerRow | null; seller: SellerRow | null;
  listing: { id: string; title: string; price_minor: number; currency: string; image_paths: string[]; status: ThreadListing['status']; type: ThreadListing['type']; fixed_price: boolean } | null;
};

const toSeller = (s: SellerRow | null): Seller | null => (s ? sellerFromRow(s) : null);

function threadFromRow(r: ThreadRow, me: string, unread: number): Thread {
  const iAmSeller = r.seller_id === me;
  return {
    id: r.id, listingId: r.listing_id, buyerId: r.buyer_id, sellerId: r.seller_id, iAmSeller,
    other: toSeller(iAmSeller ? r.buyer : r.seller),
    listing: r.listing ? { id: r.listing.id, title: r.listing.title, priceMinor: Number(r.listing.price_minor), currency: r.listing.currency, imagePath: r.listing.image_paths?.[0] ?? null, status: r.listing.status, type: r.listing.type, fixedPrice: r.listing.fixed_price } : null,
    lastMessageAt: r.last_message_at, lastKind: r.last_kind, lastPreview: r.last_preview, unread, muted: iAmSeller ? r.seller_muted : r.buyer_muted,
  };
}

// ---------------------------------------------------------------- threads
/** Opens (or reuses) the conversation about a listing. Throws `own_listing`, `blocked` or `listing_unavailable`. */
export async function startThread(userId: string, listingId: string): Promise<string> {
  if (!supabase) {
    const listing = (await loadDemoListings()).find((l) => l.id === listingId);
    if (!listing) throw new Error('listing_unavailable');
    if (listing.sellerId === userId) throw new Error('own_listing');
    const db = await loadDb(userId);
    if (db.blocked.includes(listing.sellerId)) throw new Error('blocked');
    const existing = db.threads.find((t) => t.listingId === listingId);
    if (existing) return existing.id;
    const now = new Date().toISOString();
    const thread = { id: newId(), listingId, buyerId: userId, sellerId: listing.sellerId, createdAt: now, myReadAt: now, muted: false };
    db.threads.unshift(thread);
    await saveDb(userId, db, thread.id);
    return thread.id;
  }
  const { data, error } = await supabase.rpc('start_thread', { p_listing: listingId });
  if (error) throw new Error(error.message);
  return data as string;
}

async function demoThreadView(userId: string, t: Awaited<ReturnType<typeof loadDb>>['threads'][number], db: Awaited<ReturnType<typeof loadDb>>): Promise<Thread> {
  const listing = (await loadDemoListings()).find((l) => l.id === t.listingId);
  const msgs = db.messages.filter((m) => m.threadId === t.id);
  const last = msgs[msgs.length - 1];
  return {
    id: t.id, listingId: t.listingId, buyerId: t.buyerId, sellerId: t.sellerId, iAmSeller: false, other: listing?.seller ?? null,
    listing: listing ? { id: listing.id, title: listing.title, priceMinor: listing.priceMinor, currency: listing.currency, imagePath: listing.imagePaths[0] ?? null, status: listing.status, type: listing.type, fixedPrice: listing.fixedPrice } : null,
    lastMessageAt: last?.createdAt ?? t.createdAt, lastKind: last?.kind ?? 'text', lastPreview: last?.kind === 'text' ? (last.body ?? '').slice(0, 80) : '',
    unread: msgs.filter((m) => m.senderId !== userId && m.createdAt > t.myReadAt).length, muted: t.muted,
  };
}

export async function listThreads(userId: string): Promise<Thread[]> {
  if (!supabase) {
    const db = await loadDb(userId);
    const views = await Promise.all(db.threads.map((t) => demoThreadView(userId, t, db)));
    return views.filter((v) => db.messages.some((m) => m.threadId === v.id)).sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  }
  const [threads, unread] = await Promise.all([
    supabase.from('threads').select(THREAD_SELECT).order('last_message_at', { ascending: false }).limit(100),
    supabase.rpc('unread_counts'),
  ]);
  if (threads.error) throw threads.error;
  const counts = new Map(((unread.data ?? []) as { thread_id: string; unread: number }[]).map((u) => [u.thread_id, Number(u.unread)]));
  // A thread exists as soon as someone taps Chat; it appears in the list once a message has been sent.
  return (threads.data as unknown as ThreadRow[]).filter((r) => r.last_message_at !== r.created_at).map((r) => threadFromRow(r, userId, counts.get(r.id) ?? 0));
}

export async function getThread(userId: string, threadId: string): Promise<Thread | null> {
  if (!supabase) {
    const db = await loadDb(userId);
    const t = db.threads.find((x) => x.id === threadId);
    return t ? demoThreadView(userId, t, db) : null;
  }
  const { data, error } = await supabase.from('threads').select(THREAD_SELECT).eq('id', threadId).maybeSingle();
  if (error) throw error;
  return data ? threadFromRow(data as unknown as ThreadRow, userId, 0) : null;
}

// ---------------------------------------------------------------- messages
export async function listMessages(userId: string, threadId: string): Promise<Message[]> {
  if (!supabase) return (await loadDb(userId)).messages.filter((m) => m.threadId === threadId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const { data, error } = await supabase.from('messages').select('*').eq('thread_id', threadId).order('created_at', { ascending: true }).limit(500);
  if (error) throw error;
  return (data as MessageRow[]).map(messageFromRow);
}

async function send(userId: string, threadId: string, kind: 'text' | 'image' | 'meetup', fields: { body?: string; imagePath?: string; meta?: Record<string, unknown> }): Promise<void> {
  if (!supabase) {
    const db = await loadDb(userId);
    const thread = db.threads.find((t) => t.id === threadId);
    if (!thread) throw new Error('thread_not_found');
    if (db.blocked.includes(thread.sellerId)) throw new Error('blocked');
    const m = demoMessage(threadId, userId, kind, { body: fields.body ?? null, imagePath: fields.imagePath ?? null, meta: fields.meta ?? {} });
    db.messages.push(m);
    thread.myReadAt = m.createdAt;
    await saveDb(userId, db, threadId);
    scheduleBotReply(userId, m);
    return;
  }
  const { error } = await supabase.from('messages').insert({
    thread_id: threadId, sender_id: userId, kind, body: fields.body ?? null, image_path: fields.imagePath ?? null, meta: fields.meta ?? {},
  });
  if (error) throw new Error(error.message);
}

export const sendText = (userId: string, threadId: string, body: string) => send(userId, threadId, 'text', { body: body.trim().slice(0, 2000) });

export const sendMeetup = (userId: string, threadId: string, place: string, atIso: string) =>
  send(userId, threadId, 'meetup', { meta: { place: place.trim().slice(0, 120), at: atIso } });

export async function sendImage(userId: string, threadId: string, uri: string): Promise<void> {
  if (!supabase) return send(userId, threadId, 'image', { imagePath: uri });
  const bytes = await (await fetch(uri)).arrayBuffer();
  const path = `${threadId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage.from(CHAT_BUCKET).upload(path, bytes, { contentType: 'image/jpeg' });
  if (error) throw error;
  return send(userId, threadId, 'image', { imagePath: path });
}

const signedUrls = new Map<string, { url: string; expires: number }>();

/** Photos in chat live in a private bucket, so each one needs a short-lived link. Local picks are used as they are. */
export async function chatImageUrl(path: string): Promise<string> {
  if (!supabase || /^[a-z][a-z0-9+.-]*:/i.test(path)) return path;
  const hit = signedUrls.get(path);
  if (hit && hit.expires > Date.now() + 60_000) return hit.url;
  const { data, error } = await supabase.storage.from(CHAT_BUCKET).createSignedUrl(path, 3600);
  if (error || !data) throw error ?? new Error('no_url');
  signedUrls.set(path, { url: data.signedUrl, expires: Date.now() + 3_600_000 });
  return data.signedUrl;
}

// ---------------------------------------------------------------- offers
export async function sendOffer(userId: string, threadId: string, amountMinor: number): Promise<void> {
  if (!supabase) {
    const db = await loadDb(userId);
    const thread = db.threads.find((t) => t.id === threadId);
    const listing = thread && (await loadDemoListings()).find((l) => l.id === thread.listingId);
    if (!thread || !listing) throw new Error('thread_not_found');
    const problem = checkOffer(amountMinor, listing);
    if (problem) throw new Error(problem === 'fixed' ? 'fixed_price' : problem === 'invalid' ? 'invalid_amount' : problem === 'free' ? 'listing_free' : 'listing_unavailable');
    for (const m of db.messages) if (m.threadId === threadId && m.kind === 'offer' && m.offerStatus === 'pending') m.offerStatus = 'countered';
    const offer = demoMessage(threadId, userId, 'offer', { meta: { amount_minor: amountMinor, currency: listing.currency }, offerStatus: 'pending' });
    db.messages.push(offer);
    thread.myReadAt = offer.createdAt;
    await saveDb(userId, db, threadId);
    scheduleBotReply(userId, offer);
    return;
  }
  const { error } = await supabase.rpc('send_offer', { p_thread: threadId, p_amount: amountMinor });
  if (error) throw new Error(error.message);
}

/** Answer someone else's pending offer. `counter` needs an amount. */
export async function respondOffer(userId: string, message: Message, action: 'accept' | 'decline' | 'counter', counterMinor?: number): Promise<void> {
  if (!supabase) {
    if (message.senderId === userId) throw new Error('own_offer');
    if (message.offerStatus !== 'pending') throw new Error('offer_closed');
    if (action === 'counter') return sendOffer(userId, message.threadId, counterMinor ?? 0);
    const db = await loadDb(userId);
    const thread = db.threads.find((t) => t.id === message.threadId);
    if (!thread) throw new Error('thread_not_found');
    const accepted = action === 'accept';
    setOfferStatus(db, message.id, accepted ? 'accepted' : 'declined');
    db.messages.push(demoMessage(thread.id, null, 'system', { meta: { event: accepted ? 'offer_accepted' : 'offer_declined', amount_minor: message.meta.amount_minor, currency: message.meta.currency } }));
    demoUpdate(db, accepted ? 'offer_accepted' : 'offer_declined', thread, userId);
    await saveDb(userId, db, thread.id);
    return;
  }
  const { error } = await supabase.rpc('respond_offer', { p_message: message.id, p_action: action, p_counter: counterMinor ?? null });
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------- read state, mute, block, report
export async function markRead(userId: string, threadId: string): Promise<void> {
  if (!supabase) {
    const db = await loadDb(userId);
    const t = db.threads.find((x) => x.id === threadId);
    if (!t) return;
    t.myReadAt = new Date().toISOString();
    for (const u of db.updates) if (u.threadId === threadId) u.read = true;
    await saveDb(userId, db, null);
    return;
  }
  const { error } = await supabase.rpc('mark_read', { p_thread: threadId });
  if (error) throw error;
}

export async function setMuted(userId: string, threadId: string, muted: boolean): Promise<void> {
  if (!supabase) {
    const db = await loadDb(userId);
    const t = db.threads.find((x) => x.id === threadId);
    if (t) t.muted = muted;
    await saveDb(userId, db, null);
    return;
  }
  const { error } = await supabase.rpc('set_muted', { p_thread: threadId, p_muted: muted });
  if (error) throw error;
}

export async function getBlockedIds(userId: string): Promise<string[]> {
  if (!supabase) return (await loadDb(userId)).blocked;
  const { data, error } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.blocked_id as string);
}

export async function setBlocked(userId: string, otherId: string, blocked: boolean): Promise<void> {
  if (!supabase) {
    const db = await loadDb(userId);
    db.blocked = blocked ? [...new Set([...db.blocked, otherId])] : db.blocked.filter((x) => x !== otherId);
    await saveDb(userId, db, null);
    return;
  }
  const { error } = blocked
    ? await supabase.from('blocks').upsert({ blocker_id: userId, blocked_id: otherId })
    : await supabase.from('blocks').delete().eq('blocker_id', userId).eq('blocked_id', otherId);
  if (error) throw error;
}

/**
 * Reports a listing or a person. Works without an account: the server limits reports per phone (guests) or per account,
 * allows one open report per listing per reporter, and shows guest reports to moderators as "Reported by a guest".
 * Throws `rate_limited` when too many were sent in the last hour. Reporting the same listing twice counts as done.
 */
export async function reportUser(userId: string | null, input: { targetId: string; listingId?: string; threadId?: string; reason: ReportReason; details?: string }): Promise<void> {
  if (!supabase) {
    if (userId) {
      const db = await loadDb(userId);
      db.reports.push({ targetId: input.targetId, reason: input.reason, details: input.details ?? null });
      await saveDb(userId, db, null);
    }
    await addDemoReport({ reporterId: userId, targetId: input.targetId, listingId: input.listingId, reason: input.reason, details: input.details });
    return;
  }
  const { error } = await supabase.rpc('report_content', {
    p_listing: input.listingId ?? null,
    p_target: input.listingId ? null : input.targetId,
    p_reason: input.reason,
    p_details: input.details?.trim().slice(0, 1000) || null,
    p_device: await getDeviceId(),
    p_thread: input.threadId ?? null,
  });
  if (error && !error.message.includes('already_reported')) throw new Error(error.message);
}

// ---------------------------------------------------------------- live updates
/** Calls `onMessage` for every new or changed message in the thread (changes include an offer being answered). */
export function subscribeThread(userId: string, threadId: string, onMessage: (m: Message) => void): () => void {
  if (!supabase) {
    const seen = new Map<string, string>();
    const unsub = subscribeDemo((id) => {
      if (id !== threadId) return;
      loadDb(userId).then((db) => {
        for (const m of db.messages) {
          if (m.threadId !== threadId) continue;
          const fingerprint = `${m.offerStatus}`;
          if (seen.get(m.id) !== fingerprint) {
            seen.set(m.id, fingerprint);
            onMessage(m);
          }
        }
      });
    });
    return unsub;
  }
  const client = supabase;
  const channel = client
    .channel(`thread:${threadId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `thread_id=eq.${threadId}` }, (payload) => {
      if (payload.new && 'id' in payload.new) onMessage(messageFromRow(payload.new as MessageRow));
    })
    .subscribe();
  return () => {
    client.removeChannel(channel);
  };
}

export type { Seller };
export { getSeller };
