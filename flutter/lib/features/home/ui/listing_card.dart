import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../../core/money/money.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/surface_card.dart';
import '../domain/listing.dart';

class ListingCard extends StatefulWidget {
  const ListingCard({
    super.key,
    required this.listing,
    required this.origin,
    required this.now,
  });

  final Listing listing;
  final City origin;
  final DateTime now;

  @override
  State<ListingCard> createState() => _ListingCardState();
}

class _ListingCardState extends State<ListingCard> {
  bool _liked = false;

  static const _conditions = {
    Condition.newItem: 'New',
    Condition.likeNew: 'Like new',
    Condition.used: 'Used',
  };

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final l = widget.listing;
    final price = l.free ? 'Free' : formatMinor(l.priceMinor, l.currency);
    final km = distanceKm(widget.origin, l.city);
    final meta = [
      _conditions[l.condition],
      formatDistance(km),
      l.city.name,
    ].join(' · ');
    return SurfaceCard(
      radius: AppRadii.smallCard,
      semanticLabel: '${l.title}, $price',
      onTap: () {},
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AspectRatio(
            aspectRatio: 1,
            child: Stack(
              fit: StackFit.expand,
              children: [
                ColoredBox(color: t.navActiveBackground),
                if (l.picture != null)
                  SvgPicture.asset(
                    'assets/demo/${l.picture}.svg',
                    fit: BoxFit.cover,
                    semanticsLabel: l.title,
                  ),
                PositionedDirectional(
                  top: 6,
                  end: 6,
                  child: Semantics(
                    button: true,
                    selected: _liked,
                    label: _liked
                        ? 'Remove from favourites'
                        : 'Add to favourites',
                    child: GestureDetector(
                      behavior: HitTestBehavior.opaque,
                      onTap: () => setState(() => _liked = !_liked),
                      child: SizedBox.square(
                        dimension: kMinTapTarget,
                        child: Center(
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              color: t.surface,
                              shape: BoxShape.circle,
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(6),
                              child: Icon(
                                _liked ? Icons.favorite : Icons.favorite_border,
                                size: 18,
                                color: _liked ? t.rose : t.muted,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: AlignmentDirectional.centerStart,
                  child: Text(
                    price,
                    maxLines: 1,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  l.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 14),
                ),
                const SizedBox(height: 2),
                Text(
                  meta,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 12, color: t.muted),
                ),
                Text(
                  timeAgo(l.postedAt, widget.now),
                  style: TextStyle(fontSize: 12, color: t.muted),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
