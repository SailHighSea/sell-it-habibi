import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { activePalette } from '@/constants/palettes';
import { useIsDark } from '@/hooks/use-is-dark';
import { usePrefs } from '@/providers/prefs-provider';

/**
 * Screen background. Gradient background: a soft palette-coloured wash (also what the glass surfaces show through). Plain: the flat canvas colour.
 * Put it first inside the screen's root view. 
 */
export function BackdropLayer() {
  const { background, appearance } = usePrefs();
  const dark = useIsDark();
  const palette = activePalette();
  const black = appearance === 'black';
  if (black && background === 'plain') return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />;
  if (background === 'plain') return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: dark ? palette.neutrals.canvas[1] : palette.neutrals.canvas[0] }]} />;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={black ? ['#000000', '#000000', '#050505'] : dark ? palette.wash.dark : palette.wash.light}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[black ? 'rgba(255,255,255,0.05)' : dark ? palette.glow.dark : palette.glow.light, 'rgba(255,255,255,0)']}
        start={{ x: 1, y: 1 }}
        end={{ x: 0.2, y: 0.4 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
