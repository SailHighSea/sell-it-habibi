import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ReportReason } from '@/lib/chat-types';
import type { ListingStatus } from '@/lib/listing-types';
import { newId } from '@/lib/id';
import { supabase } from '@/lib/supabase';

import { loadDemoListings, mutateDemoListing, demoSeller } from './demo-store';

export type ModAction = 'dismiss' | 'warn' | 'remove_listing' | 'ban_user';
export type ReportStatus = 'open' | 'actioned' | 'dismissed';

export type ModReport = {
  id: string;
  /** `auto` means the system flagged it, `user` means a person reported it. */
  source: 'user' | 'auto';
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  createdAt: string;
  reporter: { id: string; name: string | null } | null;
  target: { id: string; name: string | null; banned: boolean } | null;
  listing: { id: string; title: string; imagePath: string | null; status: ListingStatus } | null;
  resolution: ModAction | null;
  staffNote: string | null;
};

export const isStaff = (role: string | undefined | null) => role === 'moderator' || role === 'admin';

// ---------------------------------------------------------------- demo data
const DEMO_KEY = 'sih.demo.mod.v1';

type DemoReport = { id: string; source: 'user' | 'auto'; reason: ReportReason; details: string | null; status: ReportStatus; createdAt: string; reporterName: string | null; reporterId: string | null; targetId: string | null; listingId: string | null; resolution: ModAction | null; staffNote: string | null };
type DemoMod = { reports: DemoReport[]; banned: string[] };

function seed(): DemoMod {
  const ago = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
  const base = { status: 'open' as const, resolution: null, staffNote: null, reporterId: null };
  return {
    banned: [],
    reports: [
      { ...base, id: 'demo-report-1', source: 'auto', reason: 'prohibited', details: 'Possible counterfeit: the title says "replica" and "first copy", and the description asks buyers to move to WhatsApp.', createdAt: ago(2), reporterName: null, targetId: 'demo-seller-layla', listingId: 'demo-listing-13' },
      { ...base, id: 'demo-report-2', source: 'user', reason: 'scam', details: 'Asked me to pay a deposit by bank transfer before I could see the sofa.', createdAt: ago(7), reporterName: 'Sara M.', targetId: 'demo-seller-omar', listingId: 'demo-listing-3' },
      { ...base, id: 'demo-report-3', source: 'user', reason: 'spam', details: null, createdAt: ago(30), reporterName: 'Khalid R.', targetId: 'demo-seller-layla', listingId: null },
    ],
  };
}

async function loadDemo(): Promise<DemoMod> {
  try {
    const raw = await AsyncStorage.getItem(DEMO_KEY);
    if (raw) return JSON.parse(raw) as DemoMod;
  } catch {
    // seed below
  }
  const fresh = seed();
  await AsyncStorage.setItem(DEMO_KEY, JSON.stringify(fresh)).catch(() => {});
  return fresh;
}

const saveDemo = (m: DemoMod) => AsyncStorage.setItem(DEMO_KEY, JSON.stringify(m)).catch(() => {});

/** Demo mode: a report filed in chat or on a listing lands in the same queue the moderator sees. */
export async function addDemoReport(r: { reporterId: string; targetId: string | null; listingId?: string | null; reason: ReportReason; details?: string | null }): Promise<void> {
  const m = await loadDemo();
  m.reports.unshift({ id: newId(), source: 'user', reason: r.reason, details: r.details?.trim() || null, status: 'open', createdAt: new Date().toISOString(), reporterName: 'You', reporterId: r.reporterId, targetId: r.targetId, listingId: r.listingId ?? null, resolution: null, staffNote: null });
  await saveDemo(m);
}

// ---------------------------------------------------------------- queue
type Row = {
  id: string; source: 'user' | 'auto'; reason: ReportReason; details: string | null; status: ReportStatus; created_at: string; resolution: ModAction | null; staff_note: string | null;
  reporter: { id: string; display_name: string | null } | null;
  target: { id: string; display_name: string | null; banned_at: string | null } | null;
  listing: { id: string; title: string; image_paths: string[]; status: ListingStatus } | null;
};

/** `open` is the work queue; `closed` is what has been actioned or dismissed. Staff only (the database refuses everyone else). */
export async function listReports(view: 'open' | 'closed'): Promise<ModReport[]> {
  if (!supabase) {
    const m = await loadDemo();
    const listings = await loadDemoListings();
    return m.reports
      .filter((r) => (view === 'open' ? r.status === 'open' : r.status !== 'open'))
      .map((r) => {
        const l = listings.find((x) => x.id === r.listingId);
        return {
          id: r.id, source: r.source, reason: r.reason, details: r.details, status: r.status, createdAt: r.createdAt,
          reporter: r.reporterName ? { id: r.reporterId ?? r.reporterName, name: r.reporterName } : null,
          target: r.targetId ? { id: r.targetId, name: l?.seller?.id === r.targetId ? (l.seller.displayName ?? null) : (demoSeller(r.targetId)?.displayName ?? null), banned: m.banned.includes(r.targetId) } : null,
          listing: l ? { id: l.id, title: l.title, imagePath: l.imagePaths[0] ?? null, status: l.status } : null,
          resolution: r.resolution, staffNote: r.staffNote,
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  let q = supabase
    .from('reports')
    .select('id,source,reason,details,status,created_at,resolution,staff_note,reporter:profiles!reporter_id(id,display_name),target:profiles!target_user_id(id,display_name,banned_at),listing:listings(id,title,image_paths,status)')
    .order('created_at', { ascending: false })
    .limit(100);
  q = view === 'open' ? q.eq('status', 'open') : q.neq('status', 'open');
  const { data, error } = await q;
  if (error) throw error;
  return (data as unknown as Row[]).map((r) => ({
    id: r.id, source: r.source, reason: r.reason, details: r.details, status: r.status, createdAt: r.created_at,
    reporter: r.reporter ? { id: r.reporter.id, name: r.reporter.display_name } : null,
    target: r.target ? { id: r.target.id, name: r.target.display_name, banned: !!r.target.banned_at } : null,
    listing: r.listing ? { id: r.listing.id, title: r.listing.title, imagePath: r.listing.image_paths?.[0] ?? null, status: r.listing.status } : null,
    resolution: r.resolution, staffNote: r.staff_note,
  }));
}

/** One action closes a report; the people affected get a notification. */
export async function resolveReport(reportId: string, action: ModAction, note: string): Promise<void> {
  const text = note.trim().slice(0, 500) || null;
  if (!supabase) {
    const m = await loadDemo();
    const r = m.reports.find((x) => x.id === reportId);
    if (!r || r.status !== 'open') throw new Error('report_closed');
    if (action === 'remove_listing') {
      if (!r.listingId) throw new Error('no_listing');
      await mutateDemoListing(r.listingId, (l) => ({ ...l, status: 'removed' }));
    } else if (action === 'ban_user' && r.targetId) {
      m.banned.push(r.targetId);
      const listings = await loadDemoListings();
      for (const l of listings) if (l.sellerId === r.targetId && (l.status === 'active' || l.status === 'inactive')) await mutateDemoListing(l.id, (x) => ({ ...x, status: 'removed' }));
    } else if ((action === 'ban_user' || action === 'warn') && !r.targetId) {
      throw new Error('no_target');
    }
    r.status = action === 'dismiss' ? 'dismissed' : 'actioned';
    r.resolution = action;
    r.staffNote = text;
    await saveDemo(m);
    return;
  }
  const { error } = await supabase.rpc('resolve_report', { p_report: reportId, p_action: action, p_note: text });
  if (error) throw new Error(error.message);
}

export async function unbanUser(userId: string): Promise<void> {
  if (!supabase) {
    const m = await loadDemo();
    m.banned = m.banned.filter((x) => x !== userId);
    await saveDemo(m);
    return;
  }
  const { error } = await supabase.rpc('unban_user', { p_user: userId });
  if (error) throw new Error(error.message);
}
