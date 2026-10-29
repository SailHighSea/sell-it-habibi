import type { Language } from '@/i18n';

type Label = Record<Language, string>;

export type Category = { slug: string; name: Label; children?: Category[] };

/** Mirrors the `categories` table. Listings point at a leaf (or a top-level slug). */
export const CATEGORY_TREE: Category[] = [
  { slug: 'cars', name: { en: 'Cars', ar: 'سيارات' }, children: [
    { slug: 'used-cars', name: { en: 'Used cars', ar: 'سيارات مستعملة' } },
    { slug: 'car-parts', name: { en: 'Parts and accessories', ar: 'قطع وإكسسوارات' } },
  ] },
  { slug: 'phones', name: { en: 'Phones', ar: 'هواتف' }, children: [
    { slug: 'smartphones', name: { en: 'Smartphones', ar: 'هواتف ذكية' } },
    { slug: 'phone-accessories', name: { en: 'Phone accessories', ar: 'إكسسوارات الهواتف' } },
    { slug: 'tablets', name: { en: 'Tablets', ar: 'أجهزة لوحية' } },
  ] },
  { slug: 'furniture', name: { en: 'Furniture', ar: 'أثاث' }, children: [
    { slug: 'sofas-majlis', name: { en: 'Sofas and majlis', ar: 'كنب ومجالس' } },
    { slug: 'beds-bedroom', name: { en: 'Beds and bedroom', ar: 'غرف نوم' } },
    { slug: 'tables-chairs', name: { en: 'Tables and chairs', ar: 'طاولات وكراسي' } },
  ] },
  { slug: 'fashion', name: { en: 'Fashion', ar: 'أزياء' }, children: [
    { slug: 'womens-fashion', name: { en: "Women's fashion", ar: 'أزياء نسائية' } },
    { slug: 'mens-fashion', name: { en: "Men's fashion", ar: 'أزياء رجالية' } },
    { slug: 'abayas-modest', name: { en: 'Abayas and modest wear', ar: 'عبايات وأزياء محتشمة' } },
  ] },
  { slug: 'electronics', name: { en: 'Electronics', ar: 'إلكترونيات' }, children: [
    { slug: 'computers-laptops', name: { en: 'Computers and laptops', ar: 'حواسيب ولابتوب' } },
    { slug: 'gaming', name: { en: 'Gaming', ar: 'ألعاب فيديو' } },
    { slug: 'tv-audio', name: { en: 'TV and audio', ar: 'تلفزيونات وصوتيات' } },
  ] },
  { slug: 'property', name: { en: 'Property', ar: 'عقارات' }, children: [
    { slug: 'property-rent', name: { en: 'For rent', ar: 'للإيجار' } },
    { slug: 'property-sale', name: { en: 'For sale', ar: 'للبيع' } },
  ] },
  { slug: 'kids', name: { en: 'Kids', ar: 'أطفال' }, children: [
    { slug: 'baby-gear', name: { en: 'Baby gear', ar: 'مستلزمات الأطفال' } },
    { slug: 'toys', name: { en: 'Toys', ar: 'ألعاب' } },
  ] },
  { slug: 'sports', name: { en: 'Sports', ar: 'رياضة' }, children: [
    { slug: 'bikes', name: { en: 'Bikes', ar: 'دراجات' } },
    { slug: 'fitness', name: { en: 'Fitness', ar: 'لياقة بدنية' } },
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
  return BY_SLUG.get(slug)?.category.name[language] ?? slug;
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
