import 'dart:math' as math;

enum Condition { newItem, likeNew, used }

class Seller {
  const Seller({required this.name, required this.verified});

  final String name;
  final bool verified;
}

class City {
  const City(this.id, this.name, this.lat, this.lng, this.currency);

  final String id;
  final String name;
  final double lat;
  final double lng;

  /// Currency of the city's country; Home only shows listings priced in it.
  final String currency;
}

class Listing {
  const Listing({
    required this.id,
    required this.title,
    required this.priceMinor,
    required this.currency,
    required this.condition,
    required this.category,
    required this.city,
    required this.seller,
    required this.postedAt,
    required this.likes,
    this.picture,
    this.free = false,
  });

  final String id;
  final String title;

  /// Integer minor units (fils for AED). Zero for free items.
  final int priceMinor;
  final String currency;
  final Condition condition;

  /// Top-level category slug.
  final String category;
  final City city;
  final Seller seller;
  final DateTime postedAt;
  final int likes;

  /// Asset name under assets/demo, without extension.
  final String? picture;
  final bool free;
}

/// Great-circle distance in kilometres.
double distanceKm(City a, City b) {
  double rad(double d) => d * math.pi / 180;
  final dLat = rad(b.lat - a.lat);
  final dLng = rad(b.lng - a.lng);
  final h =
      math.pow(math.sin(dLat / 2), 2) +
      math.cos(rad(a.lat)) *
          math.cos(rad(b.lat)) *
          math.pow(math.sin(dLng / 2), 2);
  return 2 * 6371 * math.asin(math.min(1, math.sqrt(h)));
}

/// "850 m", "2.3 km", "14 km".
String formatDistance(double km) {
  if (km < 1) return '${math.max(50, (km * 1000 / 50).round() * 50)} m';
  return km < 10 ? '${(km * 10).round() / 10} km' : '${km.round()} km';
}

/// "2h ago", "3d ago".
String timeAgo(DateTime at, DateTime now) {
  final d = now.difference(at);
  if (d.inMinutes < 1) return 'just now';
  if (d.inHours < 1) return '${d.inMinutes}m ago';
  if (d.inDays < 1) return '${d.inHours}h ago';
  return '${d.inDays}d ago';
}
