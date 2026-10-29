import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { activePalette } from '@/constants/palettes';
import { useIsDark } from '@/hooks/use-is-dark';
import { mix, withAlpha } from '@/lib/color';
import { backgroundImage } from '@/lib/glass';
import { usePrefs } from '@/providers/prefs-provider';

/**
 * Screen background. Gradient: the Family Expenses backdrop, a pale (light) or deep (dark) base from the palette with three
 * soft colour patches, which the glass surfaces show through. Plain: the flat canvas colour.
 * The patches are radial gradients on one view, drawn once, so scrolling never redraws them.
 */
export function BackdropLayer() {
  const { background, appearance } = usePrefs();
  const dark = useIsDark();
  const { width, height } = useWindowDimensions();
  const palette = activePalette();
  const black = appearance === 'black';

  if (background === 'plain') {
    const color = black ? '#000000' : dark ? palette.neutrals.canvas[1] : palette.neutrals.canvas[0];
    return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: color }]} />;
  }

  const [a, b] = palette.header.light;
  const accent = palette.accent;
  // Light: tint each colour toward white. Dark and pure black: bring each colour up out of black.
  const tone = (c: string, amount: number) => (dark ? mix('#000000', c, amount) : mix(c, '#ffffff', 1 - amount));
  const base = !dark ? mix(a, '#ffffff', 0.88) : black ? '#000000' : mix('#000000', a, 0.22);
  const reach = Math.min(width, height);
  const patch = (x: number, y: number, radius: number, color: string) => `radial-gradient(circle ${Math.round(radius * reach)}px at ${x}% ${y}%, ${color}, ${withAlpha(color, 0)})`;
  // Alignment (-0.8, -0.7), (0.9, -0.2) and (-0.3, 0.9) as percentages of the screen.
  const image = [
    patch(10, 15, 0.9, tone(a, 0.55)),
    patch(95, 40, 0.8, tone(b, 0.5)),
    patch(35, 95, 0.9, tone(accent, dark ? 0.3 : 0.45)),
  ].join(', ');
  void height;
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: base }, backgroundImage(image)]} />;
}
