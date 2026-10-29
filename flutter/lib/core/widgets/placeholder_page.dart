import 'package:flutter/material.dart';

import '../layout/adaptive_shell.dart';
import '../layout/window_class.dart';
import '../theme/app_tokens.dart';

/// A tab that arrives in a later phase.
class PlaceholderPage extends StatelessWidget {
  const PlaceholderPage({
    super.key,
    required this.title,
    required this.icon,
    required this.phase,
  });

  final String title;
  final IconData icon;
  final String phase;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final bottom = context.windowClass == WindowClass.compact
        ? bottomBarHeight
        : 0.0;
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(bottom: bottom),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 48, color: t.muted),
              const SizedBox(height: 12),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 4),
              Text('Coming in $phase', style: TextStyle(color: t.muted)),
            ],
          ),
        ),
      ),
    );
  }
}
