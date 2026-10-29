import { CITIES, type City } from '@/constants/cities';
import type { CountryCode } from '@/constants/countries';

import { normalizeSearch } from './arabic';

export type LatLng = { lat: number; lng: number };

export const RADIUS_OPTIONS_KM = [5, 10, 25, 50, 100] as const;
export const DEFAULT_RADIUS_KM = 10;

const EARTH_KM = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in kilometres. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Latitude/longitude box that contains the circle, for a cheap database pre-filter. */
export function boundingBox(c: LatLng, radiusKm: number) {
  const dLat = (radiusKm / EARTH_KM) * (180 / Math.PI);
  const dLng = dLat / Math.max(0.01, Math.cos(rad(c.lat)));
  return { minLat: c.lat - dLat, maxLat: c.lat + dLat, minLng: c.lng - dLng, maxLng: c.lng + dLng };
}

/** "850 m", "2.3 km", "14 km". */
export function formatDistance(km: number, language: 'en' | 'ar'): string {
  const unit = language === 'ar' ? { m: 'م', km: 'كم' } : { m: 'm', km: 'km' };
  if (km < 1) return `${Math.max(50, Math.round((km * 1000) / 50) * 50)} ${unit.m}`;
  return `${km < 10 ? (Math.round(km * 10) / 10).toString() : Math.round(km)} ${unit.km}`;
}

export function findCity(name: string | null | undefined, country?: CountryCode): City | undefined {
  const n = normalizeSearch((name ?? '').trim());
  if (!n) return undefined;
  const pool = country ? CITIES.filter((c) => c.country === country) : CITIES;
  return pool.find((c) => normalizeSearch(c.en) === n || normalizeSearch(c.ar) === n);
}

export function nearestCity(p: LatLng, country?: CountryCode): City {
  const pool = (country ? CITIES.filter((c) => c.country === country) : CITIES) as City[];
  return pool.reduce((best, c) => (distanceKm(p, c) < distanceKm(p, best) ? c : best), pool[0]);
}

/**
 * A listing's public pin: the centre of its area nudged by up to about 400 m, so the map pin never shows a home.
 * `seed` (the listing id) keeps the nudge stable across edits.
 */
export function approximatePin(base: LatLng, seed: string): LatLng {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const angle = ((h >>> 0) % 3600) / 10;
  const dist = 0.1 + (((h >>> 12) >>> 0) % 300) / 1000; // 0.1 to 0.4 km
  const dLat = (dist * Math.cos(rad(angle))) / 111;
  const dLng = (dist * Math.sin(rad(angle))) / (111 * Math.cos(rad(base.lat)));
  return { lat: Math.round((base.lat + dLat) * 1e4) / 1e4, lng: Math.round((base.lng + dLng) * 1e4) / 1e4 };
}
