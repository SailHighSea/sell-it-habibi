// Fast checks for the pure logic (no React Native needed). Run: npm test
import { COUNTRIES } from '../constants/countries';
import { categoryLabel, slugsUnder, topLevelOf } from '../constants/categories';
import { normalizeSearch, searchTokens } from '../lib/arabic';
import { validateDisplayName } from '../lib/display-name';
import { matchesQuery, rankForYou, runQuery, tabQuery } from '../lib/listing-query';
import type { Listing } from '../lib/listing-types';
import { formatMinor, parseMinor } from '../lib/money';
import { isValidNational, normalizeNational, toE164 } from '../lib/phone';
import { availableHours, buildMeetupAt, meetupDays } from '../lib/meetup';
import { canCounter, canMakeOffer, checkOffer, demoSellerDecision, suggestOffers } from '../lib/offers';
import { sanitizeSuggestion } from '../lib/suggestion';
import { timeAgo } from '../lib/time';

let failures = 0;
function eq(actual: unknown, expected: unknown, name: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures++;
    console.log(`FAIL ${name}\n  expected ${e}\n  actual   ${a}`);
  }
}

// ---- money ----
eq(parseMinor('12.5', 'AED'), 1250, 'AED 12.5');
eq(parseMinor('1,200', 'AED'), 120000, 'thousands separator');
eq(parseMinor('١٢٫٥٠', 'AED'), 1250, 'Arabic digits and decimal mark');
eq(parseMinor('1.234', 'KWD'), 1234, 'KWD has 3 decimals');
eq(parseMinor('1.234', 'AED'), null, 'too many decimals');
eq(parseMinor('-5', 'AED'), null, 'negative');
eq(parseMinor('abc', 'AED'), null, 'junk');
eq(formatMinor(320000, 'AED', 'en-AE').replace(/\s/g, ' '), 'AED 3,200', 'format');

// ---- phone ----
const [ae, , , kw] = COUNTRIES;
eq(normalizeNational('050 123 4567'), '501234567', 'drops leading 0');
eq(normalizeNational('٠٥٠١٢٣٤٥٦٧'), '501234567', 'Arabic digits');
eq(toE164('0501234567', ae), '+971501234567', 'E.164');
eq(isValidNational('50123456', ae), false, 'AE needs 9 digits');
eq(isValidNational('50123456', kw), true, 'KW needs 8 digits');

// ---- display names ----
eq(validateDisplayName('Yousef A.'), true, 'name ok');
eq(validateDisplayName('يوسف ع.'), true, 'Arabic name ok');
eq(validateDisplayName('me@example.com'), false, 'email rejected');
eq(validateDisplayName('0501234567'), false, 'phone rejected');
eq(validateDisplayName('Y'), false, 'too short');

// ---- Arabic-aware search folding ----
eq(normalizeSearch('أَحمد'), 'احمد', 'diacritics and hamza');
eq(normalizeSearch('إيفون'), 'ايفون', 'alef with hamza below');
eq(normalizeSearch('مدرسة'), 'مدرسه', 'ta marbuta');
eq(normalizeSearch('على'), 'علي', 'alef maqsura');
eq(normalizeSearch('كــتاب'), 'كتاب', 'tatweel');
eq(normalizeSearch('iPhone ١٥'), 'iphone 15', 'case and digits');
eq(searchTokens('  آيفون   15 '), ['ايفون', '15'], 'tokens');

// ---- categories ----
eq(slugsUnder('phones'), ['phones', 'smartphones', 'phone-accessories', 'tablets'], 'parent includes children');
eq(slugsUnder('smartphones'), ['smartphones'], 'leaf only');
eq(topLevelOf('gaming'), 'electronics', 'top level of leaf');
eq(categoryLabel('abayas-modest', 'ar'), 'عبايات وأزياء محتشمة', 'Arabic label');

// ---- queries ----
const NOW = Date.parse('2026-10-29T12:00:00Z');
const hoursAgo = (h: number) => new Date(NOW - h * 3_600_000).toISOString();
function make(id: string, over: Partial<Listing>): Listing {
  return {
    id, sellerId: 's1', title: 't', description: null, priceMinor: 10000, currency: 'AED', condition: 'used', type: 'sale',
    categorySlug: 'smartphones', country: 'AE', city: 'Dubai', status: 'active', attributes: {}, fixedPrice: false, preOrder: false,
    dealMethods: ['meetup'], imagePaths: [], favoriteCount: 0, createdAt: hoursAgo(1), bumpedAt: hoursAgo(1), ...over,
  };
}
const data: Listing[] = [
  make('a', { title: 'iPhone 15 Pro', priceMinor: 320000, favoriteCount: 5, bumpedAt: hoursAgo(2), city: 'Dubai Marina' }),
  make('b', { title: 'آيفون 13', description: 'بحالة ممتازة', priceMinor: 150000, bumpedAt: hoursAgo(5), city: 'Sharjah' }),
  make('c', { title: 'Free sofa', type: 'free', priceMinor: 0, categorySlug: 'sofas-majlis', bumpedAt: hoursAgo(1), sellerId: 's2' }),
  make('d', { title: 'Old laptop', status: 'sold', categorySlug: 'computers-laptops' }),
  make('e', { title: 'Saudi listing', country: 'SA' }),
  make('f', { title: 'Majlis set', categorySlug: 'sofas-majlis', favoriteCount: 9, bumpedAt: hoursAgo(40), sellerId: 's2' }),
];
const ids = (l: Listing[]) => l.map((x) => x.id);

eq(ids(runQuery(data, { country: 'AE' })), ['c', 'a', 'b', 'f'], 'newest first, active and country only');
eq(ids(runQuery(data, { country: 'AE', text: 'iphone' })), ['a'], 'text match');
eq(ids(runQuery(data, { country: 'AE', text: 'ايفون' })), ['b'], 'Arabic text match');
eq(ids(runQuery(data, { country: 'AE', text: 'آيفون' })), ['b'], 'hamza-folded match');
eq(ids(runQuery(data, { country: 'AE', text: 'ممتازه' })), ['b'], 'ta marbuta folded against description');
eq(ids(runQuery(data, { country: 'AE', text: 'iphone pro' })), ['a'], 'all tokens must match');
eq(ids(runQuery(data, { country: 'AE', text: 'nokia' })), [], 'no match');
eq(ids(runQuery(data, { country: 'AE', category: 'phones' })), ['a', 'b'], 'category includes children');
eq(ids(runQuery(data, { country: 'AE', freeOnly: true })), ['c'], 'free only');
eq(ids(runQuery(data, { country: 'AE', minPriceMinor: 200000 })), ['a'], 'min price');
eq(ids(runQuery(data, { country: 'AE', maxPriceMinor: 150000, sort: 'priceAsc' })), ['c', 'f', 'b'], 'max price sorted asc');
eq(ids(runQuery(data, { country: 'AE', sort: 'popular' })), ['f', 'a', 'c', 'b'], 'popular');
eq(ids(runQuery(data, { country: 'AE', sort: 'priceDesc' })).slice(0, 2), ['a', 'b'], 'price desc');
eq(ids(runQuery(data, { country: 'AE', city: 'sharjah' })), ['b'], 'city is case-insensitive');
eq(ids(runQuery(data, { country: 'AE', sellerIds: ['s2'] })), ['c', 'f'], 'following sellers');
eq(ids(runQuery(data, { country: 'AE', sellerIds: [] })), [], 'following nobody');
eq(ids(runQuery(data, { status: 'all', sellerId: 's1' })).includes('d'), true, 'owner sees sold with status all');
eq(matchesQuery(data[3], { country: 'AE' }), false, 'sold hidden by default');
eq(tabQuery('free', { followingIds: [] }).freeOnly, true, 'free tab');
eq(tabQuery('nearby', { city: 'Dubai', followingIds: [] }).city, 'Dubai', 'nearby tab uses city');

// ---- for you ranking ----
const ranked = rankForYou(runQuery(data, { country: 'AE' }), ['furniture'], NOW);
eq(ids(ranked).slice(0, 2), ['f', 'c'], 'interest-matching listings come first, popular one slightly ahead');
eq(ids(ranked).indexOf('f') < ids(ranked).indexOf('b'), true, 'interest beats a bit of age');
eq(ids(rankForYou(runQuery(data, { country: 'AE' }), [], NOW)), ['a', 'f', 'c', 'b'], 'no interests: freshness plus a small popularity boost');

// ---- AI output is untrusted ----
const s = sanitizeSuggestion({
  title: '  ' + 'x'.repeat(300), category_slug: 'smartphones', condition: 'mint', bullet_points: ['ok', 7, '', 'y'.repeat(500)],
  description_casual: 'hi', description_short: 's', price_min: 200, price_max: 100,
});
eq(s.title.length, 120, 'title clipped');
eq(s.categorySlug, 'smartphones', 'known category kept');
eq(s.condition, 'used', 'unknown condition falls back');
eq(s.bulletPoints.length, 2, 'bad bullets dropped');
eq(s.bulletPoints[1].length, 160, 'bullet clipped');
eq([s.priceMin, s.priceMax], [null, null], 'inverted range dropped');
eq(sanitizeSuggestion({ category_slug: '<script>' }).categorySlug, null, 'unknown category dropped');
eq(sanitizeSuggestion(null).title, '', 'null input');


// ---- offers ----
const target = { type: 'sale' as const, status: 'active' as const, fixedPrice: false, priceMinor: 100000 };
eq(checkOffer(80000, target), null, 'normal offer ok');
eq(checkOffer(0, target), 'invalid', 'zero offer');
eq(checkOffer(null, target), 'invalid', 'missing amount');
eq(checkOffer(12.5, target), 'invalid', 'fractional minor units');
eq(checkOffer(80000, { ...target, type: 'free' }), 'free', 'no offers on free items');
eq(checkOffer(80000, { ...target, status: 'sold' }), 'unavailable', 'no offers on sold items');
eq(checkOffer(90000, { ...target, fixedPrice: true }), 'fixed', 'fixed price needs the listed price');
eq(checkOffer(100000, { ...target, fixedPrice: true }), null, 'fixed price at list price ok');
eq(canMakeOffer({ ...target, type: 'free' }), false, 'free: no offer button');
eq(canCounter({ ...target, fixedPrice: true }), false, 'fixed price: no counter');
eq(suggestOffers(100000, 'AED'), [90000, 80000, 70000], 'suggestions at 90/80/70%');
eq(suggestOffers(320000, 'AED'), [290000, 255000, 225000], 'big items round to 50s');
eq(suggestOffers(25000, 'AED'), [23000, 20000, 18000], '100 to 1000: round to 10s');
eq(suggestOffers(5000, 'AED'), [4500, 4000, 3500], 'under 100: round to 5s');
eq(suggestOffers(1000, 'AED').every((v) => v > 0 && v < 1000), true, 'suggestions stay below the price');
eq(suggestOffers(12000, 'KWD').every((v) => v % 5000 === 0), true, 'KWD rounds in 3-decimal units');
eq(demoSellerDecision(95000, 100000, 'AED').action, 'accept', 'demo seller accepts 95%');
eq(demoSellerDecision(75000, 100000, 'AED'), { action: 'counter', amountMinor: 95000 }, 'demo seller counters 75%');
eq(demoSellerDecision(30000, 100000, 'AED').action, 'decline', 'demo seller declines 30%');

// ---- meet-up slots ----
const noon = new Date(2026, 9, 29, 12, 0);
const days = meetupDays(noon, 3);
eq(days.length, 3, 'three days');
eq(availableHours(days[0], noon), [13, 17, 20], 'past slots hidden for today (needs 30 min notice)');
eq(availableHours(days[0], new Date(2026, 9, 29, 12, 45)), [17, 20], '13:00 hidden when under 30 min away');
eq(availableHours(days[1], noon), [10, 13, 17, 20], 'all slots tomorrow');
eq(new Date(buildMeetupAt(days[1], 17)).getHours(), 17, 'meet-up time set');
eq(new Date(buildMeetupAt(days[1], 17)).getDate(), 30, 'meet-up date is tomorrow');

// ---- relative time ----
eq(timeAgo(hoursAgo(2), 'en', NOW), '2 hr. ago', 'English time ago');
eq(timeAgo(new Date(NOW - 30_000).toISOString(), 'en', NOW).length > 0, true, 'seconds');

if (failures) {
  console.log(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('all checks passed');
