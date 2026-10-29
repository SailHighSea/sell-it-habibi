import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import '../theme/app_tokens.dart';
import 'glass.dart';

/// A card that is solid with a hairline edge normally and frosted glass when the Glass look is on.
class SurfaceCard extends StatelessWidget {
  const SurfaceCard({
    super.key,
    required this.child,
    this.radius = AppRadii.card,
    this.blur = 0,
    this.onTap,
    this.semanticLabel,
  });

  final Widget child;
  final double radius;
  final double blur;
  final VoidCallback? onTap;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final r = BorderRadius.circular(radius);
    // Its own Material, so ink and list tiles inside paint above the card's colour.
    final content = Material(
      type: MaterialType.transparency,
      child: onTap == null
          ? child
          : InkWell(onTap: onTap, borderRadius: r, child: child),
    );
    final card = GlassScope.of(context)
        ? GlassBox(
            color: t.surface,
            borderRadius: r,
            blur: blur,
            child: content,
          )
        : DecoratedBox(
            decoration: BoxDecoration(
              color: t.surface,
              borderRadius: r,
              border: Border.all(color: t.border),
            ),
            child: ClipRRect(borderRadius: r, child: content),
          );
    return semanticLabel == null
        ? card
        : Semantics(container: true, label: semanticLabel, child: card);
  }
}
