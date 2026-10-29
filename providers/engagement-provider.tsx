import { router } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { getFavoriteIds, getFollowingIds, setFavorite, setFollow } from '@/services/engagement';

import { useAuth } from './auth-provider';

type Loaded = { userId: string; favorites: string[]; following: string[] };

type Engagement = {
  followingIds: string[];
  isFavorite: (listingId: string) => boolean;
  isFollowing: (sellerId: string) => boolean;
  /** Sends guests to sign-in and returns false; otherwise toggles optimistically. */
  toggleFavorite: (listingId: string) => Promise<boolean>;
  toggleFollow: (sellerId: string) => Promise<boolean>;
};

const Ctx = createContext<Engagement | null>(null);

export function EngagementProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const userId = status === 'signedIn' ? user?.id : undefined;
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    Promise.all([getFavoriteIds(userId), getFollowingIds(userId)])
      .then(([favorites, following]) => !cancelled && setLoaded({ userId, favorites, following }))
      .catch(() => !cancelled && setLoaded({ userId, favorites: [], following: [] }));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Data for a previous account is ignored, so there is nothing to reset on sign-out.
  const mine = loaded && loaded.userId === userId ? loaded : null;
  const favorites = mine?.favorites;
  const following = mine?.following;

  const toggle = useCallback(
    async (kind: 'favorites' | 'following', id: string): Promise<boolean> => {
      if (!userId) {
        router.push('/sign-in');
        return false;
      }
      const list = (kind === 'favorites' ? favorites : following) ?? [];
      const on = !list.includes(id);
      const apply = (add: boolean) =>
        setLoaded((prev) =>
          prev && prev.userId === userId
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
    [userId, favorites, following],
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
