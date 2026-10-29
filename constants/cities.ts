import type { CountryCode } from './countries';

export type City = { id: string; country: CountryCode; en: string; ar: string; lat: number; lng: number };

/** City and district centres, approximate. Used to place listings (never an exact address) and as the "near me" origin when GPS is off. */
export const CITIES: City[] = [
  { id: 'dubai-marina', country: 'AE', en: 'Dubai Marina', ar: 'دبي مارينا', lat: 25.0805, lng: 55.1403 },
  { id: 'business-bay', country: 'AE', en: 'Business Bay', ar: 'الخليج التجاري', lat: 25.1864, lng: 55.2633 },
  { id: 'jumeirah', country: 'AE', en: 'Jumeirah', ar: 'جميرا', lat: 25.2048, lng: 55.2408 },
  { id: 'dubai-hills', country: 'AE', en: 'Dubai Hills', ar: 'دبي هيلز', lat: 25.1032, lng: 55.2437 },
  { id: 'dubai', country: 'AE', en: 'Dubai', ar: 'دبي', lat: 25.2048, lng: 55.2708 },
  { id: 'sharjah', country: 'AE', en: 'Sharjah', ar: 'الشارقة', lat: 25.3463, lng: 55.4209 },
  { id: 'ajman', country: 'AE', en: 'Ajman', ar: 'عجمان', lat: 25.4052, lng: 55.5136 },
  { id: 'abu-dhabi', country: 'AE', en: 'Abu Dhabi', ar: 'أبوظبي', lat: 24.4539, lng: 54.3773 },
  { id: 'al-ain', country: 'AE', en: 'Al Ain', ar: 'العين', lat: 24.2075, lng: 55.7447 },
  { id: 'ras-al-khaimah', country: 'AE', en: 'Ras Al Khaimah', ar: 'رأس الخيمة', lat: 25.6741, lng: 55.9804 },
  { id: 'riyadh', country: 'SA', en: 'Riyadh', ar: 'الرياض', lat: 24.7136, lng: 46.6753 },
  { id: 'jeddah', country: 'SA', en: 'Jeddah', ar: 'جدة', lat: 21.4858, lng: 39.1925 },
  { id: 'dammam', country: 'SA', en: 'Dammam', ar: 'الدمام', lat: 26.4207, lng: 50.0888 },
  { id: 'khobar', country: 'SA', en: 'Khobar', ar: 'الخبر', lat: 26.2794, lng: 50.2083 },
  { id: 'mecca', country: 'SA', en: 'Mecca', ar: 'مكة المكرمة', lat: 21.3891, lng: 39.8579 },
  { id: 'medina', country: 'SA', en: 'Medina', ar: 'المدينة المنورة', lat: 24.5247, lng: 39.5692 },
  { id: 'doha', country: 'QA', en: 'Doha', ar: 'الدوحة', lat: 25.2854, lng: 51.531 },
  { id: 'al-wakrah', country: 'QA', en: 'Al Wakrah', ar: 'الوكرة', lat: 25.1715, lng: 51.6034 },
  { id: 'al-rayyan', country: 'QA', en: 'Al Rayyan', ar: 'الريان', lat: 25.2919, lng: 51.4244 },
  { id: 'kuwait-city', country: 'KW', en: 'Kuwait City', ar: 'مدينة الكويت', lat: 29.3759, lng: 47.9774 },
  { id: 'hawalli', country: 'KW', en: 'Hawalli', ar: 'حولي', lat: 29.3328, lng: 48.0286 },
  { id: 'salmiya', country: 'KW', en: 'Salmiya', ar: 'السالمية', lat: 29.3340, lng: 48.0760 },
  { id: 'manama', country: 'BH', en: 'Manama', ar: 'المنامة', lat: 26.2235, lng: 50.5876 },
  { id: 'muharraq', country: 'BH', en: 'Muharraq', ar: 'المحرق', lat: 26.2572, lng: 50.6119 },
  { id: 'riffa', country: 'BH', en: 'Riffa', ar: 'الرفاع', lat: 26.13, lng: 50.555 },
  { id: 'muscat', country: 'OM', en: 'Muscat', ar: 'مسقط', lat: 23.588, lng: 58.3829 },
  { id: 'seeb', country: 'OM', en: 'Seeb', ar: 'السيب', lat: 23.67, lng: 58.189 },
  { id: 'salalah', country: 'OM', en: 'Salalah', ar: 'صلالة', lat: 17.0151, lng: 54.0924 },
];

export const citiesIn = (country: CountryCode): City[] => CITIES.filter((c) => c.country === country);
