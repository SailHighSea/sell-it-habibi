import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/listing.dart';
import 'demo_listings.dart';

enum FeedTab {
  forYou('For you'),
  top('Top picks'),
  nearby('Nearby'),
  free('Free'),
  following('Following');

  const FeedTab(this.label);
  final String label;
}

/// How far "Nearby" looks. A radius picker comes with F3.
const nearbyRadiusKm = 25.0;

final nowProvider = Provider<DateTime>((ref) => DateTime.now());

final listingRepositoryProvider = Provider<ListingRepository>(
  (ref) => DemoListingRepository(ref.watch(nowProvider)),
);

final allListingsProvider = FutureProvider<List<Listing>>(
  (ref) => ref.watch(listingRepositoryProvider).all(),
);

class CityIndex extends Notifier<int> {
  @override
  int build() => 0;

  void step(int delta) =>
      state = (state + delta + demoCities.length) % demoCities.length;
}

final cityIndexProvider = NotifierProvider<CityIndex, int>(CityIndex.new);
final cityProvider = Provider<City>(
  (ref) => demoCities[ref.watch(cityIndexProvider)],
);

class FeedTabController extends Notifier<FeedTab> {
  @override
  FeedTab build() => FeedTab.forYou;

  void select(FeedTab tab) => state = tab;
}

final feedTabProvider = NotifierProvider<FeedTabController, FeedTab>(
  FeedTabController.new,
);

class CategoryFilter extends Notifier<String?> {
  @override
  String? build() => null;

  /// Tapping the chosen category again clears it.
  void toggle(String slug) => state = state == slug ? null : slug;

  void clear() => state = null;
}

final categoryFilterProvider = NotifierProvider<CategoryFilter, String?>(
  CategoryFilter.new,
);

/// Listings in the chosen city's country, narrowed by tab and category.
List<Listing> applyFeed(
  List<Listing> all, {
  required City city,
  required FeedTab tab,
  required String? category,
}) {
  var items = all.where((l) => l.currency == city.currency).toList();
  if (category != null) {
    items = items.where((l) => l.category == category).toList();
  }
  switch (tab) {
    case FeedTab.forYou:
      items.sort((a, b) => b.postedAt.compareTo(a.postedAt));
    case FeedTab.top:
      items.sort((a, b) => b.likes.compareTo(a.likes));
    case FeedTab.nearby:
      items =
          items
              .where((l) => distanceKm(city, l.city) <= nearbyRadiusKm)
              .toList()
            ..sort(
              (a, b) =>
                  distanceKm(city, a.city).compareTo(distanceKm(city, b.city)),
            );
    case FeedTab.free:
      items = items.where((l) => l.free).toList();
    case FeedTab.following:
      items = [];
  }
  return items;
}

class NearbyStats {
  const NearbyStats(this.newToday, this.free, this.verifiedSellers);
  final int newToday;
  final int free;
  final int verifiedSellers;
}

NearbyStats nearbyStats(List<Listing> all, City city, DateTime now) {
  final near = all
      .where(
        (l) =>
            l.currency == city.currency &&
            distanceKm(city, l.city) <= nearbyRadiusKm,
      )
      .toList();
  return NearbyStats(
    near.where((l) => now.difference(l.postedAt).inHours < 24).length,
    near.where((l) => l.free).length,
    near
        .where((l) => l.seller.verified)
        .map((l) => l.seller.name)
        .toSet()
        .length,
  );
}
