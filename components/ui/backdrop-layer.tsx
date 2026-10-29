import { Image } from 'expo-image';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { activeTokens, activeVariant, backdropSource , activePaletteId } from '@/constants/palettes';
import { mix, withAlpha } from '@/lib/color';
import { backgroundImage } from '@/lib/glass';
import { usePrefs } from '@/providers/prefs-provider';

/**
 * Screen background. Gradient: the Family Expenses backdrop, a pale (light) or deep (dark) base from the theme with three
 * soft colour patches, which the glass surfaces show through. Pure black and Plain are flat (true black, or the page colour).
 * The patches are radial gradients on one view, drawn once, so scrolling never redraws them.
 */
export function BackdropLayer() {
  const { background, picture, blur } = usePrefs();
  const { width, height } = useWindowDimensions();
  const variant = activeVariant();
  const dark = variant !== 'light';

  // A picture of your own, blurred, and dimmed a little so text stays readable (the same idea as the expenses app's personal background).
  if (background === 'picture' && picture) {
    return (
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: activeTokens().background }]}>
        <Image source={{ uri: picture }} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={blur} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: dark ? 'rgba(0,0,0,0.38)' : 'rgba(255,255,255,0.35)' }]} />
      </View>
    );
  }

  if (background === 'plain' || variant === 'pure') {
    return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: activeTokens().background }]} />;
  }

  const { a, b, accent } = backdropSource(activePaletteId());
  // Light: tint each colour toward white. Dark: bring each colour up out of black.
  const tone = (c: string, amount: number) => (dark ? mix('#000000', c, amount) : mix(c, '#ffffff', 1 - amount));
  const base = dark ? mix('#000000', a, 0.22) : mix(a, '#ffffff', 0.88);
  const reach = Math.min(width, height);
  const patch = (x: number, y: number, radius: number, color: string) => `radial-gradient(circle ${Math.round(radius * reach)}px at ${x}% ${y}%, ${color}, ${withAlpha(color, 0)})`;
  // Alignment (-0.8, -0.7), (0.9, -0.2) and (-0.3, 0.9) as percentages of the screen.
  const image = [patch(10, 15, 0.9, tone(a, 0.55)), patch(95, 40, 0.8, tone(b, 0.5)), patch(35, 95, 0.9, tone(accent, dark ? 0.3 : 0.45))].join(', ');
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: base }, backgroundImage(image)]} />;
}
