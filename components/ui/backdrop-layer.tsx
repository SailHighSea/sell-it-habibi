import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { activePalette } from '@/constants/palettes';
import { useIsDark } from '@/hooks/use-is-dark';
import { usePrefs } from '@/providers/prefs-provider';

/**
 * Screen background. Frosted look: a soft colour wash so the glass surfaces have something to show through.
 * Put it first inside the screen's root view. In the Classic look it is the flat canvas colour.
 */
export function BackdropLayer() {
  const { look } = usePrefs();
  const dark = useIsDark();
  const palette = activePalette();
  if (look !== 'frosted') return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: dark ? '#0E1512' : '#F4F6F5' }]} />;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={dark ? palette.wash.dark : palette.wash.light}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[dark ? palette.glow.dark : palette.glow.light, 'rgba(255,255,255,0)']}
        start={{ x: 1, y: 1 }}
        end={{ x: 0.2, y: 0.4 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
