import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { getFavoriteIds, getFollowingIds, mergeGuestData, setFavorite, setFollow } from '@/services/engagement';

import { useAuth } from './auth-provider';

type Loaded = { owner: string; favorites: string[]; following: string[] };

type Engagement = {
  followingIds: string[];
  isFavorite: (listingId: string) => boolean;
  isFollowing: (sellerId: string) => boolean;
  /** Works without an account (kept on the phone) and with one (kept on the server). Updates the screen right away, undoes it if saving fails. */
  toggleFavorite: (listingId: string) => Promise<boolean>;
  toggleFollow: (sellerId: string) => Promise<boolean>;
};

const Ctx = createContext<Engagement | null>(null);

export function EngagementProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const userId = status === 'signedIn' ? (user?.id ?? null) : null;
  const owner = userId ?? 'guest';
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    let cancelled = false;
    (async () => {
      // On sign-in, what the person liked and followed as a guest moves into their account first.
      if (userId) await mergeGuestData(userId).catch(() => {});
      const [favorites, following] = await Promise.all([getFavoriteIds(userId), getFollowingIds(userId)]);
      if (!cancelled) setLoaded({ owner, favorites, following });
    })().catch(() => !cancelled && setLoaded({ owner, favorites: [], following: [] }));
    return () => {
      cancelled = true;
    };
  }, [status, userId, owner]);

  // Lists for a previous owner (guest or another account) are ignored, so there is nothing to reset on sign-out.
  const mine = loaded && loaded.owner === owner ? loaded : null;
  const favorites = mine?.favorites;
  const following = mine?.following;

  const toggle = useCallback(
    async (kind: 'favorites' | 'following', id: string): Promise<boolean> => {
      const list = (kind === 'favorites' ? favorites : following) ?? [];
      const on = !list.includes(id);
      const apply = (add: boolean) =>
        setLoaded((prev) =>
          prev && prev.owner === owner
            ? { ...prev, [kind]: add ? [...prev[kind].filter((x) => x !== id), id] : prev[kind].filter((x) => x !== id) }
            : prev,
        );
      apply(on);
      try {
        await (kind === 'favorites' ? setFavorite(userId, id, on) : setFollow(userId, id, on));
        return true;
      } catch {
        apply(!on);
        return false;
      }
    },
    [userId, owner, favorites, following],
  );

  const value = useMemo<Engagement>(
    () => ({
      followingIds: following ?? [],
      isFavorite: (id) => !!favorites?.includes(id),
      isFollowing: (id) => !!following?.includes(id),
      toggleFavorite: (id) => toggle('favorites', id),
      toggleFollow: (id) => toggle('following', id),
    }),
    [favorites, following, toggle],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEngagement(): Engagement {
  const v = useContext(Ctx);
  if (!v) throw new Error('useEngagement must be used inside EngagementProvider');
  return v;
}
