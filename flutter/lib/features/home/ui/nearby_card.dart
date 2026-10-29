import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/widgets/surface_card.dart';
import '../data/home_providers.dart';

/// The Home location card: city with previous/next arrows, how far we look, and what is around.
class NearbyCard extends ConsumerWidget {
  const NearbyCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = context.tokens;
    final city = ref.watch(cityProvider);
    final now = ref.watch(nowProvider);
    final stats = ref
        .watch(allListingsProvider)
        .whenData((all) => nearbyStats(all, city, now))
        .value;
    String num(int? n) => n == null ? '–' : '$n';
    final controller = ref.read(cityIndexProvider.notifier);
    return SurfaceCard(
      blur: 20,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              children: [
                IconButton(
                  tooltip: 'Previous city',
                  constraints: const BoxConstraints.tightFor(
                    width: kMinTapTarget,
                    height: kMinTapTarget,
                  ),
                  onPressed: () => controller.step(-1),
                  icon: Icon(Icons.chevron_left, color: t.primary),
                ),
                Expanded(
                  child: Column(
                    children: [
                      Text(
                        city.name,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      Text(
                        'Within ${nearbyRadiusKm.round()} km of ${city.name}',
                        style: TextStyle(fontSize: 12, color: t.muted),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  tooltip: 'Next city',
                  constraints: const BoxConstraints.tightFor(
                    width: kMinTapTarget,
                    height: kMinTapTarget,
                  ),
                  onPressed: () => controller.step(1),
                  icon: Icon(Icons.chevron_right, color: t.primary),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Divider(height: 1, color: t.border),
            const SizedBox(height: 12),
            Row(
              children: [
                _Stat('New today', num(stats?.newToday)),
                _Stat('Free items', num(stats?.free)),
                _Stat('Verified sellers', num(stats?.verifiedSellers)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Expanded(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(fontSize: 12, color: context.tokens.muted),
        ),
        Text(
          value,
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
        ),
      ],
    ),
  );
}
