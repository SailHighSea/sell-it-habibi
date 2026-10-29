import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { Listing } from '@/lib/listing-types';

export const PAGE_SIZE = 20;

type State = { key: string; items: Listing[]; done: boolean; failed: boolean };

/**
 * Infinite list: loads one page, then more as the person scrolls (`loadMore`). Put every input of `fetchPage` in `key`;
 * a new key starts again from the first page. Coming back to the screen refreshes what is already loaded in one request.
 */
export function usePagedListings(key: string, fetchPage: (offset: number, limit: number) => Promise<Listing[]>) {
  const [state, setState] = useState<State | null>(null);
  const [tick, setTick] = useState(0);
  const busy = useRef(false);
  const latest = useRef({ key, fetchPage, state });
  latest.current = { key, fetchPage, state };

  useEffect(() => {
    let cancelled = false;
    const loaded = latest.current.state?.key === key ? latest.current.state.items.length : 0;
    const limit = Math.max(PAGE_SIZE, loaded);
    latest.current.fetchPage(0, limit).then(
      (items) => !cancelled && setState({ key, items, done: items.length < limit, failed: false }),
      () => !cancelled && setState({ key, items: [], done: true, failed: true }),
    );
    return () => {
      cancelled = true;
    };
    // `key` carries every input of `fetchPage`; `tick` is a manual reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick]);

  const reload = useCallback(() => setTick((n) => n + 1), []);
  useFocusEffect(reload);

  const loadMore = useCallback(() => {
    const { key: k, fetchPage: fetch, state: s } = latest.current;
    if (!s || s.key !== k || s.done || s.failed || busy.current) return;
    busy.current = true;
    fetch(s.items.length, PAGE_SIZE)
      .then((more) => {
        const seen = new Set(s.items.map((l) => l.id));
        const fresh = more.filter((l) => !seen.has(l.id));
        setState((cur) => (cur && cur.key === k ? { ...cur, items: [...cur.items, ...fresh], done: more.length < PAGE_SIZE } : cur));
      })
      .catch(() => setState((cur) => (cur && cur.key === k ? { ...cur, done: true } : cur)))
      .finally(() => {
        busy.current = false;
      });
  }, []);

  const current = state?.key === key ? state : null;
  return { items: current?.items ?? [], loading: !current, failed: !!current?.failed, done: current?.done ?? false, loadMore, reload };
}
