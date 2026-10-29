import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/layout/adaptive_shell.dart';
import '../../core/layout/window_class.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/widgets/surface_card.dart';

/// The Me tab. Account features arrive in F2; for now it links to Settings > Appearance.
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final bottom = context.windowClass == WindowClass.compact
        ? bottomBarHeight + 16
        : 16.0;
    return SafeArea(
      bottom: false,
      child: ListView(
        padding: EdgeInsets.fromLTRB(16, 16, 16, bottom),
        children: [
          const Text(
            'Me',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 16),
          SurfaceCard(
            onTap: () => context.push('/settings/appearance'),
            child: ListTile(
              minTileHeight: 56,
              leading: Icon(Icons.palette_outlined, color: t.primary),
              title: const Text('Appearance'),
              subtitle: Text(
                'Theme, look, text size',
                style: TextStyle(color: t.muted),
              ),
              trailing: Icon(Icons.chevron_right, color: t.muted),
            ),
          ),
        ],
      ),
    );
  }
}
