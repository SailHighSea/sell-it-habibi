import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'core/routing/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/appearance_provider.dart';
import 'core/theme/appearance_settings.dart';
import 'core/theme/glass_backdrop.dart';
import 'core/theme/color_themes.dart';
import 'core/widgets/glass.dart';

class SellItHabibiApp extends ConsumerStatefulWidget {
  const SellItHabibiApp({super.key});

  @override
  ConsumerState<SellItHabibiApp> createState() => _SellItHabibiAppState();
}

class _SellItHabibiAppState extends ConsumerState<SellItHabibiApp> {
  late final GoRouter _router = buildRouter();

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(appearanceProvider);
    final glass = s.look == AppLook.glass;
    return MaterialApp.router(
      title: 'Sell It Habibi!',
      debugShowCheckedModeBanner: false,
      routerConfig: _router,
      themeMode: themeModeFor(s.mode),
      theme: buildTheme(s, ThemeVariant.light, transparentScaffold: glass),
      darkTheme: buildTheme(
        s,
        darkVariantFor(s.mode),
        transparentScaffold: glass,
      ),
      builder: (context, child) {
        final brightness = Theme.of(context).brightness;
        final media = MediaQuery.of(context);
        return MediaQuery(
          data: media.copyWith(
            textScaler: s.largerText
                ? const TextScaler.linear(1.2)
                : media.textScaler,
          ),
          child: GlassScope(
            enabled: glass,
            lightEffects: s.lightEffects,
            child: Stack(
              fit: StackFit.expand,
              children: [
                if (glass)
                  GlassBackdrop(
                    theme: s.colorTheme,
                    variant: variantFor(brightness, s.mode),
                  ),
                ?child,
              ],
            ),
          ),
        );
      },
    );
  }
}
