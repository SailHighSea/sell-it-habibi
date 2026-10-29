import type { Language } from '@/i18n';
import { pickName, type Names } from '@/lib/names';

type Label = Names;

export type Category = { slug: string; name: Label; children?: Category[] };

/** Mirrors the `categories` table. Listings point at a leaf (or a top-level slug). */
export const CATEGORY_TREE: Category[] = [
  { slug: 'cars', name: { en: 'Cars', ar: 'سيارات', si: 'වාහන' }, children: [
    { slug: 'used-cars', name: { en: 'Used cars', ar: 'سيارات مستعملة', si: 'පාවිච්චි කළ වාහන' } },
    { slug: 'car-parts', name: { en: 'Parts and accessories', ar: 'قطع وإكسسوارات', si: 'කොටස් සහ උපාංග' } },
  ] },
  { slug: 'phones', name: { en: 'Phones', ar: 'هواتف', si: 'දුරකථන' }, children: [
    { slug: 'smartphones', name: { en: 'Smartphones', ar: 'هواتف ذكية', si: 'ස්මාර්ට් දුරකථන' } },
    { slug: 'phone-accessories', name: { en: 'Phone accessories', ar: 'إكسسوارات الهواتف', si: 'දුරකථන උපාංග' } },
    { slug: 'tablets', name: { en: 'Tablets', ar: 'أجهزة لوحية', si: 'ටැබ්ලට්' } },
  ] },
  { slug: 'furniture', name: { en: 'Furniture', ar: 'أثاث', si: 'ගෘහභාණ්ඩ' }, children: [
    { slug: 'sofas-majlis', name: { en: 'Sofas and majlis', ar: 'كنب ومجالس', si: 'සෝෆා සහ ආසන' } },
    { slug: 'beds-bedroom', name: { en: 'Beds and bedroom', ar: 'غرف نوم', si: 'යහන් සහ නිදන කාමර' } },
    { slug: 'tables-chairs', name: { en: 'Tables and chairs', ar: 'طاولات وكراسي', si: 'මේස සහ පුටු' } },
  ] },
  { slug: 'fashion', name: { en: 'Fashion', ar: 'أزياء', si: 'විලාසිතා' }, children: [
    { slug: 'womens-fashion', name: { en: "Women's fashion", ar: 'أزياء نسائية', si: 'කාන්තා විලාසිතා' } },
    { slug: 'mens-fashion', name: { en: "Men's fashion", ar: 'أزياء رجالية', si: 'පිරිමි විලාසිතා' } },
    { slug: 'abayas-modest', name: { en: 'Abayas and modest wear', ar: 'عبايات وأزياء محتشمة', si: 'අබායා සහ ආචාරශීලී ඇඳුම්' } },
  ] },
  { slug: 'electronics', name: { en: 'Electronics', ar: 'إلكترونيات', si: 'ඉලෙක්ට්‍රොනික' }, children: [
    { slug: 'computers-laptops', name: { en: 'Computers and laptops', ar: 'حواسيب ولابتوب', si: 'පරිගණක සහ ලැප්ටොප්' } },
    { slug: 'gaming', name: { en: 'Gaming', ar: 'ألعاب فيديو', si: 'ක්‍රීඩා උපකරණ' } },
    { slug: 'tv-audio', name: { en: 'TV and audio', ar: 'تلفزيونات وصوتيات', si: 'රූපවාහිනී සහ ශ්‍රව්‍ය' } },
  ] },
  { slug: 'property', name: { en: 'Property', ar: 'عقارات', si: 'දේපළ' }, children: [
    { slug: 'property-rent', name: { en: 'For rent', ar: 'للإيجار', si: 'කුලියට' } },
    { slug: 'property-sale', name: { en: 'For sale', ar: 'للبيع', si: 'විකිණීමට' } },
  ] },
  { slug: 'kids', name: { en: 'Kids', ar: 'أطفال', si: 'ළමා' }, children: [
    { slug: 'baby-gear', name: { en: 'Baby gear', ar: 'مستلزمات الأطفال', si: 'බබා භාණ්ඩ' } },
    { slug: 'toys', name: { en: 'Toys', ar: 'ألعاب', si: 'සෙල්ලම් බඩු' } },
  ] },
  { slug: 'sports', name: { en: 'Sports', ar: 'رياضة', si: 'ක්‍රීඩා' }, children: [
    { slug: 'bikes', name: { en: 'Bikes', ar: 'دراجات', si: 'බයිසිකල්' } },
    { slug: 'fitness', name: { en: 'Fitness', ar: 'لياقة بدنية', si: 'ශාරීරික යෝග්‍යතාව' } },
  ] },
];

export const TOP_LEVEL_SLUGS = CATEGORY_TREE.map((c) => c.slug);

const BY_SLUG = new Map<string, { category: Category; parent?: Category }>();
for (const top of CATEGORY_TREE) {
  BY_SLUG.set(top.slug, { category: top });
  for (const child of top.children ?? []) BY_SLUG.set(child.slug, { category: child, parent: top });
}

export function isCategorySlug(slug: string): boolean {
  return BY_SLUG.has(slug);
}

export function categoryLabel(slug: string, language: Language): string {
  const category = BY_SLUG.get(slug)?.category;
  return category ? pickName(category.name, language) : slug;
}

export function topLevelOf(slug: string): string {
  return BY_SLUG.get(slug)?.parent?.slug ?? slug;
}

/** The slug itself plus every child, so filtering by "Phones" also finds smartphones. */
export function slugsUnder(slug: string): string[] {
  const entry = BY_SLUG.get(slug);
  return [slug, ...(entry?.category.children ?? []).map((c) => c.slug)];
}

export function childrenOf(slug: string): Category[] {
  return BY_SLUG.get(slug)?.category.children ?? [];
}

export type FieldDef = {
  key: string;
  kind: 'number' | 'text' | 'choice';
  label: Label;
  options?: string[];
  unit?: string;
};

/** Extra fields per top-level category, stored in `listings.attributes`. */
export const CATEGORY_FIELDS: Record<string, FieldDef[]> = {
  cars: [
    { key: 'year', kind: 'number', label: { en: 'Year', ar: 'سنة الصنع' } },
    { key: 'mileage', kind: 'number', label: { en: 'Mileage', ar: 'المسافة المقطوعة' }, unit: 'km' },
    { key: 'transmission', kind: 'choice', label: { en: 'Transmission', ar: 'ناقل الحركة' }, options: ['automatic', 'manual'] },
  ],
  phones: [
    { key: 'brand', kind: 'text', label: { en: 'Brand', ar: 'الماركة' } },
    { key: 'storage', kind: 'choice', label: { en: 'Storage', ar: 'السعة' }, options: ['64GB', '128GB', '256GB', '512GB', '1TB'] },
  ],
  electronics: [{ key: 'brand', kind: 'text', label: { en: 'Brand', ar: 'الماركة' } }],
  fashion: [
    { key: 'brand', kind: 'text', label: { en: 'Brand', ar: 'الماركة' } },
    { key: 'size', kind: 'text', label: { en: 'Size', ar: 'المقاس' } },
  ],
  property: [
    { key: 'bedrooms', kind: 'number', label: { en: 'Bedrooms', ar: 'غرف النوم' } },
    { key: 'area', kind: 'number', label: { en: 'Area', ar: 'المساحة' }, unit: 'm²' },
  ],
};

export function fieldsFor(slug: string): FieldDef[] {
  return CATEGORY_FIELDS[topLevelOf(slug)] ?? [];
}
