import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/app_theme.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/theme/appearance_provider.dart';
import '../../core/theme/appearance_settings.dart';
import '../../core/theme/color_themes.dart';
import '../../core/widgets/surface_card.dart';

/// Settings > Appearance: mode, colour theme, look, header, text size and light effects.
class AppearanceScreen extends ConsumerWidget {
  const AppearanceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(appearanceProvider);
    final c = ref.read(appearanceProvider.notifier);
    final t = context.tokens;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Appearance'),
        backgroundColor: Colors.transparent,
        scrolledUnderElevation: 0,
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 640),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
            children: [
              const _Heading('Mode'),
              _Segments<AppearanceMode>(
                values: AppearanceMode.values,
                selected: s.mode,
                label: (m) => m.label,
                onSelect: c.setMode,
              ),
              const _Heading('Colour theme'),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  for (final id in ColorThemeId.values)
                    _ThemeSwatch(
                      id: id,
                      selected: id == s.colorTheme,
                      onTap: () => c.setColorTheme(id),
                    ),
                ],
              ),
              const _Heading('Look'),
              _Segments<AppLook>(
                values: AppLook.values,
                selected: s.look,
                label: (l) => l.label,
                onSelect: c.setLook,
              ),
              const _Heading('Home header'),
              _Segments<HomeHeaderStyle>(
                values: HomeHeaderStyle.values,
                selected: s.homeHeader,
                label: (h) => h.label,
                onSelect: c.setHomeHeader,
              ),
              const SizedBox(height: 16),
              SurfaceCard(
                child: Column(
                  children: [
                    SwitchListTile(
                      title: const Text('Larger text'),
                      value: s.largerText,
                      onChanged: c.setLargerText,
                    ),
                    Divider(height: 1, color: t.border),
                    SwitchListTile(
                      title: const Text('Light effects'),
                      subtitle: const Text(
                        'No blur or soft shadows. Smoother on older phones.',
                      ),
                      value: s.lightEffects,
                      onChanged: c.setLightEffects,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Heading extends StatelessWidget {
  const _Heading(this.text);

  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 20, bottom: 8),
    child: Text(
      text,
      style: TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w700,
        color: context.tokens.muted,
      ),
    ),
  );
}

class _Segments<T> extends StatelessWidget {
  const _Segments({
    required this.values,
    required this.selected,
    required this.label,
    required this.onSelect,
  });

  final List<T> values;
  final T selected;
  final String Function(T) label;
  final void Function(T) onSelect;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final v in values)
          Semantics(
            button: true,
            selected: v == selected,
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () => onSelect(v),
              child: Container(
                constraints: const BoxConstraints(minHeight: kMinTapTarget),
                padding: const EdgeInsets.symmetric(horizontal: 18),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: v == selected ? t.primary : t.surface,
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(
                    color: v == selected ? t.primary : t.border,
                  ),
                ),
                child: Text(
                  label(v),
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: v == selected ? t.onPrimary : t.text,
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _ThemeSwatch extends StatelessWidget {
  const _ThemeSwatch({
    required this.id,
    required this.selected,
    required this.onTap,
  });

  final ColorThemeId id;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final p = previewFor(id);
    final t = context.tokens;
    return Semantics(
      button: true,
      selected: selected,
      label: id.label,
      excludeSemantics: true,
      child: GestureDetector(
        onTap: onTap,
        child: SizedBox(
          width: 72,
          child: Column(
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: p.hero,
                  border: Border.all(
                    width: selected ? 3 : 1,
                    color: selected ? t.primary : t.border,
                  ),
                ),
                alignment: Alignment.bottomRight,
                child: Container(
                  width: 20,
                  height: 20,
                  margin: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: p.accent,
                  ),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                id.label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
