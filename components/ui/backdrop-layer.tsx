import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, useColorScheme } from 'react-native';

import { usePrefs } from '@/providers/prefs-provider';

/**
 * Screen background. Frosted look: a soft colour wash so the glass surfaces have something to show through.
 * Put it first inside the screen's root view. In the Classic look it is the flat canvas colour.
 */
export function BackdropLayer() {
  const { look } = usePrefs();
  const dark = useColorScheme() === 'dark';
  if (look !== 'frosted') return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: dark ? '#0E1512' : '#F4F6F5' }]} />;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={dark ? ['#0F2A21', '#0E1512', '#0F1D2B'] : ['#D9EFE5', '#F1F6F4', '#DCEAF5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={dark ? ['rgba(76,195,138,0.16)', 'rgba(76,195,138,0)'] : ['rgba(242,184,75,0.28)', 'rgba(242,184,75,0)']}
        start={{ x: 1, y: 1 }}
        end={{ x: 0.2, y: 0.4 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
