import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

type State<T> = { key: string; data?: T; failed?: boolean };

/**
 * Loads data for `key` (put every input of `load` in the key). Reloads when the screen regains focus,
 * so a list is fresh after you edit or create something and come back.
 */
export function useAsyncData<T>(key: string, load: () => Promise<T>) {
  const [state, setState] = useState<State<T> | null>(null);
  const [tick, setTick] = useState(0);
  const fullKey = `${key}#${tick}`;

  useEffect(() => {
    let cancelled = false;
    load()
      .then((data) => !cancelled && setState({ key: fullKey, data }))
      .catch(() => !cancelled && setState({ key: fullKey, failed: true }));
    return () => {
      cancelled = true;
    };
    // `key` carries every input of `load`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullKey]);

  const refresh = useCallback(() => setTick((n) => n + 1), []);
  useFocusEffect(refresh);

  const current = state?.key === fullKey ? state : null;
  return { data: current?.data, failed: !!current?.failed, loading: !current && !state?.data, stale: !current, reload: refresh };
}
