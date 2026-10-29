import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:sell_it_habibi/app.dart';
import 'package:sell_it_habibi/core/money/money.dart';
import 'package:sell_it_habibi/core/theme/appearance_provider.dart';
import 'package:sell_it_habibi/features/home/data/demo_listings.dart';
import 'package:sell_it_habibi/features/home/data/home_providers.dart';

Future<void> pump(
  WidgetTester tester, {
  Size size = const Size(400, 900),
}) async {
  SharedPreferences.setMockInitialValues({});
  final prefs = await SharedPreferences.getInstance();
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(
    ProviderScope(
      overrides: [sharedPreferencesProvider.overrideWithValue(prefs)],
      child: const SellItHabibiApp(),
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  test('formatMinor keeps money in integer minor units', () {
    expect(formatMinor(320000, 'AED'), 'AED 3,200');
    expect(formatMinor(12050, 'AED'), 'AED 120.50');
    expect(formatMinor(0, 'AED'), 'AED 0');
  });

  test('feed filters by city currency, tab and category', () async {
    final now = DateTime(2026, 1, 1, 12);
    final all = await DemoListingRepository(now).all();
    final marina = demoCities.first;
    final colombo = demoCities.last;
    final forYou = applyFeed(
      all,
      city: marina,
      tab: FeedTab.forYou,
      category: null,
    );
    expect(forYou.every((l) => l.currency == 'AED'), isTrue);
    expect(
      applyFeed(all, city: colombo, tab: FeedTab.forYou, category: null).length,
      2,
    );
    expect(
      applyFeed(
        all,
        city: marina,
        tab: FeedTab.free,
        category: null,
      ).every((l) => l.free),
      isTrue,
    );
    expect(
      applyFeed(all, city: marina, tab: FeedTab.following, category: null),
      isEmpty,
    );
    final phones = applyFeed(
      all,
      city: marina,
      tab: FeedTab.forYou,
      category: 'phones',
    );
    expect(phones.map((l) => l.id), ['1']);
    final top = applyFeed(all, city: marina, tab: FeedTab.top, category: null);
    expect(top.first.likes, greaterThanOrEqualTo(top.last.likes));
  });

  testWidgets('Home shows the header, location card, tabs and listings', (
    tester,
  ) async {
    await pump(tester);
    expect(find.text('Sell It Habibi!'), findsOneWidget);
    expect(find.text('Dubai Marina'), findsOneWidget);
    expect(find.text('For you'), findsOneWidget);
    expect(find.text('iPhone 15 Pro 256GB'), findsOneWidget);
    expect(find.text('Home'), findsOneWidget);
  });

  testWidgets('stepping the city switches currency of the listings', (
    tester,
  ) async {
    await pump(tester);
    await tester.tap(find.byTooltip('Previous city'));
    await tester.pumpAndSettle();
    expect(find.text('Colombo'), findsOneWidget);
    expect(find.text('iPhone 15 Pro 256GB'), findsNothing);
    expect(find.text('iPhone 14 128GB'), findsOneWidget);
  });

  testWidgets('wide windows use the side rail instead of the floating bar', (
    tester,
  ) async {
    await pump(tester, size: const Size(900, 900));
    expect(find.text('Sell'), findsOneWidget);
    expect(find.text('Search cars, phones, furniture…'), findsNothing);
  });

  testWidgets('Appearance: switching to Glass look is saved', (tester) async {
    await pump(tester);
    await tester.tap(find.text('Me'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Appearance'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Glass'));
    await tester.pumpAndSettle();
    final prefs = await SharedPreferences.getInstance();
    expect(prefs.getString('appearance.look'), 'glass');
  });
}
