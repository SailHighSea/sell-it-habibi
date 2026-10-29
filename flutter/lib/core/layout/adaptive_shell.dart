import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../theme/app_theme.dart';
import '../theme/app_tokens.dart';
import '../widgets/glass.dart';
import 'destinations.dart';
import 'window_class.dart';

/// Space the floating bar takes (pill plus margins) so content can scroll clear of it.
const double bottomBarHeight = 74 + 10 + 10;

/// Frame around the five tab screens: a floating glass pill under 600 dp, a side rail from
/// 600 dp, and a full sidebar from 1200 dp.
class AdaptiveShell extends StatelessWidget {
  const AdaptiveShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  void _go(int i) => navigationShell.goBranch(
    i,
    initialLocation: i == navigationShell.currentIndex,
  );

  @override
  Widget build(BuildContext context) {
    final wc = context.windowClass;
    final sell = Semantics(
      button: true,
      label: 'Sell something',
      child: FloatingActionButton.extended(
        heroTag: 'sell',
        onPressed: () => context.push('/sell'),
        backgroundColor: context.tokens.primary,
        foregroundColor: context.tokens.onPrimary,
        icon: const Icon(Icons.add),
        label: const Text('Sell'),
      ),
    );
    if (wc == WindowClass.compact) {
      return Scaffold(
        body: Stack(
          children: [
            Positioned.fill(child: navigationShell),
            PositionedDirectional(
              end: 16,
              bottom:
                  bottomBarHeight + MediaQuery.paddingOf(context).bottom + 4,
              child: sell,
            ),
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: _BottomPill(
                index: navigationShell.currentIndex,
                onSelect: _go,
              ),
            ),
          ],
        ),
      );
    }
    return Scaffold(
      body: Row(
        children: [
          _Rail(
            expanded: wc == WindowClass.expanded,
            index: navigationShell.currentIndex,
            onSelect: _go,
            sell: sell,
          ),
          Expanded(child: navigationShell),
        ],
      ),
    );
  }
}

class _BottomPill extends StatelessWidget {
  const _BottomPill({required this.index, required this.onSelect});

  final int index;
  final ValueChanged<int> onSelect;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final glass = GlassScope.of(context);
    final bottom = MediaQuery.paddingOf(context).bottom;
    final bar = SizedBox(
      height: 74,
      child: Padding(
        padding: const EdgeInsets.all(5),
        child: Row(
          children: [
            for (var i = 0; i < destinations.length; i++)
              Expanded(
                child: _PillTab(
                  destination: destinations[i],
                  selected: i == index,
                  onTap: () => onSelect(i),
                ),
              ),
          ],
        ),
      ),
    );
    final r = BorderRadius.circular(999);
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 6, 16, bottom + 10),
      child: glass
          ? GlassBox(
              color: t.navRail,
              borderRadius: r,
              strength: 1.25,
              blur: 24,
              child: bar,
            )
          : DecoratedBox(
              decoration: BoxDecoration(
                color: t.navRail,
                borderRadius: r,
                border: Border.all(color: t.border),
                boxShadow: GlassScope.lightOf(context)
                    ? null
                    : const [
                        BoxShadow(
                          color: Color(0x22000000),
                          blurRadius: 16,
                          offset: Offset(0, 4),
                        ),
                      ],
              ),
              child: bar,
            ),
    );
  }
}

class _PillTab extends StatelessWidget {
  const _PillTab({
    required this.destination,
    required this.selected,
    required this.onTap,
  });

  final Destination destination;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final dark = Theme.of(context).brightness == Brightness.dark;
    final color = selected ? t.text : t.muted;
    return Semantics(
      button: true,
      selected: selected,
      label: destination.label,
      excludeSemantics: true,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: Container(
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: selected
                ? (dark
                      ? const Color(0x2EFFFFFF)
                      : t.primary.withValues(alpha: 0.16))
                : Colors.transparent,
            borderRadius: BorderRadius.circular(999),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                selected ? destination.iconActive : destination.icon,
                size: 24,
                color: color,
              ),
              const SizedBox(height: 3),
              Text(
                destination.label,
                maxLines: 1,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                  color: color,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Rail extends StatelessWidget {
  const _Rail({
    required this.expanded,
    required this.index,
    required this.onSelect,
    required this.sell,
  });

  final bool expanded;
  final int index;
  final ValueChanged<int> onSelect;
  final Widget sell;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final width = context.layout.railWidth;
    final rail = SizedBox(
      width: width,
      child: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: 16),
            for (var i = 0; i < destinations.length; i++)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                child: _RailItem(
                  destination: destinations[i],
                  selected: i == index,
                  expanded: expanded,
                  onTap: () => onSelect(i),
                ),
              ),
            const Spacer(),
            Padding(padding: const EdgeInsets.all(12), child: sell),
          ],
        ),
      ),
    );
    return GlassScope.of(context)
        ? GlassBox(color: t.navRail, strength: 1.1, child: rail)
        : DecoratedBox(
            decoration: BoxDecoration(
              color: t.navRail,
              border: BorderDirectional(end: BorderSide(color: t.border)),
            ),
            child: rail,
          );
  }
}

class _RailItem extends StatelessWidget {
  const _RailItem({
    required this.destination,
    required this.selected,
    required this.expanded,
    required this.onTap,
  });

  final Destination destination;
  final bool selected;
  final bool expanded;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final color = selected ? t.navActiveText : t.muted;
    final icon = Icon(
      selected ? destination.iconActive : destination.icon,
      color: color,
    );
    final label = Text(
      destination.label,
      style: TextStyle(
        fontSize: expanded ? 15 : 11,
        fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
        color: color,
      ),
    );
    return Semantics(
      button: true,
      selected: selected,
      label: destination.label,
      excludeSemantics: true,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          constraints: const BoxConstraints(minHeight: kMinTapTarget + 12),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: selected ? t.navActiveBackground : Colors.transparent,
            borderRadius: BorderRadius.circular(16),
          ),
          child: expanded
              ? Row(children: [icon, const SizedBox(width: 12), label])
              : Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [icon, const SizedBox(height: 2), label],
                ),
        ),
      ),
    );
  }
}
