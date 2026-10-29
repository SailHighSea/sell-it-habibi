import type { UpdateItem, UpdateKind } from '@/lib/chat-types';
import type { Seller } from '@/lib/listing-types';
import { SELLER_COLUMNS, sellerFromRow, type SellerRow } from '@/lib/seller';
import { supabase } from '@/lib/supabase';

import { loadDb, saveDb, subscribeDemo } from './chat-demo';
import { loadDemoListings } from './demo-store';
import { listThreads } from './chat';

type Row = {
  id: string; kind: UpdateKind; thread_id: string | null; listing_id: string | null; body: string | null; read_at: string | null; created_at: string;
  actor: SellerRow | null;
  listing: { title: string } | null;
};

export async function listUpdates(userId: string): Promise<UpdateItem[]> {
  if (!supabase) {
    const db = await loadDb(userId);
    const listings = await loadDemoListings();
    return db.updates.slice(0, 100).map((u) => {
      const thread = db.threads.find((t) => t.id === u.threadId);
      const listing = listings.find((l) => l.id === thread?.listingId);
      return { id: u.id, kind: u.kind, threadId: u.threadId, listingId: listing?.id ?? null, listingTitle: listing?.title ?? null, actor: (listing?.seller ?? null) as Seller | null, body: u.body, read: u.read, createdAt: u.createdAt };
    });
  }
  const { data, error } = await supabase
    .from('notifications')
    .select(`id,kind,thread_id,listing_id,body,read_at,created_at,actor:profiles!actor_id(${SELLER_COLUMNS}),listing:listings(title)`)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data as unknown as Row[]).map((r) => ({
    id: r.id, kind: r.kind, threadId: r.thread_id, listingId: r.listing_id, listingTitle: r.listing?.title ?? null, body: r.body, read: !!r.read_at, createdAt: r.created_at,
    actor: r.actor ? sellerFromRow(r.actor) : null,
  }));
}

export async function markUpdateRead(userId: string, id: string): Promise<void> {
  if (!supabase) {
    const db = await loadDb(userId);
    const u = db.updates.find((x) => x.id === id);
    if (u) u.read = true;
    await saveDb(userId, db, null);
    return;
  }
  const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id).is('read_at', null);
  if (error) throw error;
}

export async function markAllUpdatesRead(userId: string): Promise<void> {
  if (!supabase) {
    const db = await loadDb(userId);
    for (const u of db.updates) u.read = true;
    await saveDb(userId, db, null);
    return;
  }
  const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', userId).is('read_at', null);
  if (error) throw error;
}

/** Numbers for the tab badges: conversations with unread messages, and unread updates. */
export async function getBadgeCounts(userId: string): Promise<{ chats: number; updates: number }> {
  if (!supabase) {
    const db = await loadDb(userId);
    return { chats: (await listThreads(userId)).filter((t) => t.unread > 0).length, updates: db.updates.filter((u) => !u.read).length };
  }
  const [unread, updates] = await Promise.all([
    supabase.rpc('unread_counts'),
    supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', userId).is('read_at', null),
  ]);
  return {
    chats: ((unread.data ?? []) as { unread: number }[]).filter((u) => Number(u.unread) > 0).length,
    updates: updates.count ?? 0,
  };
}

/** Calls back when something new arrives for this user. */
export function subscribeInbox(userId: string, cb: () => void): () => void {
  if (!supabase) return subscribeDemo(() => cb());
  const client = supabase;
  const channel = client
    .channel(`inbox:${userId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, () => cb())
    .subscribe();
  return () => {
    client.removeChannel(channel);
  };
}
