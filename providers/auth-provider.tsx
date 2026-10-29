import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { onAuthChange, signOut as signOutService, type AuthUser } from '@/services/auth';
import { getProfile, saveProfile, type Profile, type ProfilePatch } from '@/services/profile';

type AuthState = {
  /** `loading` until the stored session and its profile have been read once. */
  status: 'loading' | 'signedOut' | 'signedIn';
  user: AuthUser | null;
  profile: Profile | null;
  updateProfile: (patch: ProfilePatch) => Promise<Profile>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthState['status']>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(
    () =>
      onAuthChange((next) => {
        setUser((prev) => (prev?.id === next?.id ? prev : next));
        if (!next) {
          setProfile(null);
          setStatus('signedOut');
        }
      }),
    [],
  );

  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    getProfile(userId)
      .then((p) => !cancelled && setProfile(p))
      // A failed read must not lock the user out; treat them as not yet onboarded so they can fill it in again.
      .catch(() => !cancelled && setProfile({ id: userId, displayName: null, bio: null, city: null, country: 'AE', avatarUrl: null, interests: [], phoneVerified: false, onboarded: false, role: 'user', ratingAvg: null, ratingCount: 0 }))
      .finally(() => !cancelled && setStatus('signedIn'));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const updateProfile = useCallback(
    async (patch: ProfilePatch) => {
      if (!userId) throw new Error('not_signed_in');
      const next = await saveProfile(userId, patch);
      setProfile(next);
      return next;
    },
    [userId],
  );

  const value = useMemo<AuthState>(
    () => ({ status, user, profile, updateProfile, signOut: signOutService }),
    [status, user, profile, updateProfile],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside AuthProvider');
  return v;
}
