import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { getBadgeCounts, subscribeInbox } from '@/services/updates';

import { useAuth } from './auth-provider';

type Inbox = {
  /** Conversations with unread messages. */
  chats: number;
  /** Unread updates. */
  updates: number;
  /** Re-reads the counts, e.g. after opening a chat. */
  refresh: () => void;
};

const Ctx = createContext<Inbox | null>(null);

export function InboxProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const userId = status === 'signedIn' ? user?.id : undefined;
  const [state, setState] = useState<{ userId: string; chats: number; updates: number } | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    getBadgeCounts(userId)
      .then((c) => !cancelled && setState({ userId, ...c }))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId, tick]);

  useEffect(() => (userId ? subscribeInbox(userId, () => setTick((n) => n + 1)) : undefined), [userId]);

  const refresh = useCallback(() => setTick((n) => n + 1), []);
  const mine = state && state.userId === userId ? state : null;
  const value = useMemo<Inbox>(() => ({ chats: mine?.chats ?? 0, updates: mine?.updates ?? 0, refresh }), [mine, refresh]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useInbox(): Inbox {
  const v = useContext(Ctx);
  if (!v) throw new Error('useInbox must be used inside InboxProvider');
  return v;
}
