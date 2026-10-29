import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { CITIES, citiesIn, type City } from '@/constants/cities';
import { DEFAULT_RADIUS_KM, findCity, nearestCity, type LatLng } from '@/lib/geo';
import { useAuth } from '@/providers/auth-provider';
import { usePrefs } from '@/providers/prefs-provider';

const KEY = 'sih.location.v1';

type Stored = { cityId?: string; radiusKm?: number; gps?: LatLng | null };

type Ctx = {
  /** The city shown on Home (the nearest city to the phone when GPS is on). */
  city: City;
  /** Where "near me" is measured from: the phone, or the centre of the chosen city. */
  origin: LatLng;
  radiusKm: number;
  usingGps: boolean;
  setCity: (id: string) => void;
  /** Move to the next (+1) or previous (-1) city of the country. Turns GPS off. */
  stepCity: (dir: 1 | -1) => void;
  setRadiusKm: (km: number) => void;
  /** Ask for the phone's location. `denied` or `unavailable` change nothing; `ok` includes where the phone is. */
  locateMe: () => Promise<{ status: 'ok' | 'denied' | 'unavailable'; coords?: LatLng }>;
};

const LocationCtx = createContext<Ctx | null>(null);

/** Where the person is browsing from. Works without an account and without GPS; the position never leaves the phone. */
export function LocationProvider({ children }: { children: ReactNode }) {
  const { country } = usePrefs();
  const { profile } = useAuth();
  const [stored, setStored] = useState<Stored>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw && setStored(JSON.parse(raw) as Stored))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const save = useCallback((patch: Stored) => {
    setStored((cur) => {
      const next = { ...cur, ...patch };
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo<Ctx>(() => {
    const pool = citiesIn(country.code);
    const profileCity = findCity(profile?.city, country.code);
    const picked = CITIES.find((c) => c.id === stored.cityId && c.country === country.code);
    const gps = stored.gps ?? null;
    const city = gps ? nearestCity(gps, country.code) : (picked ?? profileCity ?? pool[0]);
    return {
      city,
      origin: gps ?? { lat: city.lat, lng: city.lng },
      radiusKm: stored.radiusKm ?? DEFAULT_RADIUS_KM,
      usingGps: !!gps,
      setCity: (id) => save({ cityId: id, gps: null }),
      stepCity: (dir) => {
        const at = Math.max(0, pool.findIndex((c) => c.id === city.id));
        save({ cityId: pool[(at + dir + pool.length) % pool.length].id, gps: null });
      },
      setRadiusKm: (km) => save({ radiusKm: km }),
      locateMe: async () => {
        try {
          const perm = await Location.requestForegroundPermissionsAsync();
          if (perm.status !== 'granted') return { status: 'denied' };
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          save({ gps: coords });
          return { status: 'ok', coords };
        } catch {
          return { status: 'unavailable' };
        }
      },
    };
  }, [country.code, profile?.city, stored, save]);

  if (!ready) return null;
  return <LocationCtx.Provider value={value}>{children}</LocationCtx.Provider>;
}

export function useLocation(): Ctx {
  const v = useContext(LocationCtx);
  if (!v) throw new Error('useLocation must be used inside LocationProvider');
  return v;
}
