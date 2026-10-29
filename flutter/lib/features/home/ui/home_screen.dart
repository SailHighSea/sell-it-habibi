import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/layout/window_class.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/appearance_provider.dart';
import '../../../core/theme/appearance_settings.dart';
import '../../../core/theme/header_gradient.dart';
import '../data/demo_listings.dart';
import '../data/home_providers.dart';
import '../domain/listing.dart';
import 'listing_card.dart';
import 'nearby_card.dart';

const _appName = 'Sell It Habibi!';
const _tagline = 'Second-hand and new, near you';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({
    super.key,
    required this.onOpenSearch,
    required this.onOpenProfile,
  });

  final VoidCallback onOpenSearch;
  final VoidCallback onOpenProfile;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final wc = context.windowClass;
    final city = ref.watch(cityProvider);
    final tab = ref.watch(feedTabProvider);
    final category = ref.watch(categoryFilterProvider);
    final now = ref.watch(nowProvider);
    final listings = ref.watch(allListingsProvider);
    final settings = ref.watch(appearanceProvider);
    final columns = switch (wc) {
      WindowClass.compact => 2,
      WindowClass.medium => 3,
      WindowClass.expanded => 4,
    };
    final bottomPad = wc == WindowClass.compact ? 120.0 : 32.0;
    final items = listings.whenData(
      (all) => applyFeed(all, city: city, tab: tab, category: category),
    );
    const side = 16.0;
    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(
          child:
              wc == WindowClass.compact &&
                  settings.homeHeader == HomeHeaderStyle.gradient
              ? _GradientHeader(
                  onOpenSearch: onOpenSearch,
                  onOpenProfile: onOpenProfile,
                  card: const NearbyCard(),
                )
              : Padding(
                  padding: EdgeInsets.fromLTRB(
                    side,
                    wc == WindowClass.compact ? 16 : 0,
                    side,
                    0,
                  ),
                  child: const NearbyCard(),
                ),
        ),
        const SliverToBoxAdapter(child: _TabRow()),
        const SliverToBoxAdapter(child: _CategoryChips()),
        const SliverToBoxAdapter(child: SizedBox(height: 12)),
        switch (items) {
          AsyncData(:final value) when value.isEmpty => SliverToBoxAdapter(
            child: _Empty(tab: tab, city: city),
          ),
          AsyncData(:final value) => SliverPadding(
            padding: EdgeInsets.fromLTRB(side, 0, side, bottomPad),
            sliver: SliverGrid.builder(
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: columns,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                mainAxisExtent: _cardExtent(context, columns, side),
              ),
              itemCount: value.length,
              itemBuilder: (_, i) =>
                  ListingCard(listing: value[i], origin: city, now: now),
            ),
          ),
          AsyncError() => const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.all(32),
              child: Center(child: Text('We could not load listings.')),
            ),
          ),
          _ => const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.all(32),
              child: Center(child: CircularProgressIndicator()),
            ),
          ),
        },
      ],
    );
  }

  /// A card is a square picture plus about 130 dp of text, scaled up with larger text.
  double _cardExtent(BuildContext context, int columns, double side) {
    final width = MediaQuery.sizeOf(context).width;
    final railOrSidebar = context.layout.railWidth;
    final cell =
        (width - railOrSidebar - side * 2 - 12 * (columns - 1)) / columns;
    final scale = MediaQuery.textScalerOf(context).scale(1);
    return cell + 134 * scale;
  }
}

class _GradientHeader extends ConsumerWidget {
  const _GradientHeader({
    required this.onOpenSearch,
    required this.onOpenProfile,
    required this.card,
  });

  final VoidCallback onOpenSearch;
  final VoidCallback onOpenProfile;

  /// The location card; it rides up over the lower edge of the gradient band.
  final Widget card;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settings = ref.watch(appearanceProvider);
    final variant = variantFor(Theme.of(context).brightness, settings.mode);
    final (a, b) = headerGradientFor(settings.colorTheme, variant);
    final top = MediaQuery.paddingOf(context).top;
    const overlap = 36.0;
    return Stack(
      children: [
        Positioned.fill(
          bottom: overlap + 40,
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: const Alignment(1, 0.4),
                colors: [a, b],
              ),
              borderRadius: const BorderRadius.vertical(
                bottom: Radius.circular(32),
              ),
            ),
          ),
        ),
        Padding(
          padding: EdgeInsets.fromLTRB(16, top + 12, 16, 0),
          child: Column(
            children: [
              _HeaderContent(
                onOpenSearch: onOpenSearch,
                onOpenProfile: onOpenProfile,
              ),
              const SizedBox(height: 16),
              card,
            ],
          ),
        ),
      ],
    );
  }
}

class _HeaderContent extends StatelessWidget {
  const _HeaderContent({
    required this.onOpenSearch,
    required this.onOpenProfile,
  });

  final VoidCallback onOpenSearch;
  final VoidCallback onOpenProfile;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            const _Logo(size: 40),
            const SizedBox(width: 12),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _appName,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    _tagline,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 12, color: Color(0xD9FFFFFF)),
                  ),
                ],
              ),
            ),
            Semantics(
              button: true,
              label: 'Profile',
              child: GestureDetector(
                onTap: onOpenProfile,
                child: const SizedBox.square(
                  dimension: kMinTapTarget,
                  child: Center(
                    child: CircleAvatar(
                      radius: 20,
                      backgroundColor: Color(0x33FFFFFF),
                      child: Icon(Icons.person, color: Colors.white),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Semantics(
          button: true,
          label: 'Search',
          child: GestureDetector(
            onTap: onOpenSearch,
            child: Container(
              constraints: const BoxConstraints(minHeight: 48),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(999),
              ),
              child: const Row(
                children: [
                  Icon(Icons.search, size: 18, color: Color(0xFF55645D)),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Search cars, phones, furniture…',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 16, color: Color(0xFF55645D)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _Logo extends StatelessWidget {
  const _Logo({required this.size});

  final double size;

  @override
  Widget build(BuildContext context) => Container(
    width: size,
    height: size,
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(size * 0.3),
    ),
    child: Icon(
      Icons.storefront,
      size: size * 0.6,
      color: context.tokens.primary,
    ),
  );
}

class _TabRow extends ConsumerWidget {
  const _TabRow();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.tokens;
    final selected = ref.watch(feedTabProvider);
    return SizedBox(
      height: kMinTapTarget + 4,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: [
          for (final tab in FeedTab.values)
            Semantics(
              button: true,
              selected: tab == selected,
              child: InkWell(
                onTap: () => ref.read(feedTabProvider.notifier).select(tab),
                child: Container(
                  constraints: const BoxConstraints(minHeight: kMinTapTarget),
                  margin: const EdgeInsetsDirectional.only(end: 20),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    border: Border(
                      bottom: BorderSide(
                        width: 2,
                        color: tab == selected ? t.primary : Colors.transparent,
                      ),
                    ),
                  ),
                  child: Text(
                    tab.label,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: tab == selected ? t.primary : t.muted,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _CategoryChips extends ConsumerWidget {
  const _CategoryChips();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selected = ref.watch(categoryFilterProvider);
    final controller = ref.read(categoryFilterProvider.notifier);
    return SizedBox(
      height: kMinTapTarget,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: [
          _Chip(
            label: 'All',
            selected: selected == null,
            onTap: controller.clear,
          ),
          for (final e in categoryNames.entries)
            _Chip(
              label: e.value,
              selected: selected == e.key,
              onTap: () => controller.toggle(e.key),
            ),
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return Padding(
      padding: const EdgeInsetsDirectional.only(end: 8),
      child: Semantics(
        button: true,
        selected: selected,
        child: GestureDetector(
          onTap: onTap,
          behavior: HitTestBehavior.opaque,
          child: Center(
            child: Container(
              constraints: const BoxConstraints(minHeight: 36),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: selected ? t.primary : t.surface,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: selected ? t.primary : t.border),
              ),
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: selected ? t.onPrimary : t.text,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Empty extends StatelessWidget {
  const _Empty({required this.tab, required this.city});

  final FeedTab tab;
  final City city;

  @override
  Widget build(BuildContext context) {
    final text = switch (tab) {
      FeedTab.following =>
        'Follow sellers from their listings and their new items show up here.',
      FeedTab.nearby =>
        'Nothing within ${nearbyRadiusKm.round()} km of ${city.name} yet.',
      _ => 'No listings here yet. Be the first to sell something.',
    };
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Center(
        child: Text(
          text,
          textAlign: TextAlign.center,
          style: TextStyle(color: context.tokens.muted),
        ),
      ),
    );
  }
}
