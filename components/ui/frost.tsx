import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { StyleSheet, View, useColorScheme, type StyleProp, type ViewStyle } from 'react-native';

type Props = { children: ReactNode; className?: string; style?: StyleProp<ViewStyle>; intensity?: number };

/**
 * Frosted-glass surface, as in the Family Expenses app: the content behind it shows through, blurred,
 * under a translucent tint and a hairline edge. Callers supply shape (rounded-*) and padding.
 */
export function Frost({ children, className = '', style, intensity = 40 }: Props) {
  const dark = useColorScheme() === 'dark';
  return (
    <View
      className={`overflow-hidden border ${dark ? 'border-white/10' : 'border-white/70'} ${className}`}
      style={[{ shadowColor: '#000', shadowOpacity: dark ? 0.35 : 0.14, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 }, style]}>
      <BlurView
        pointerEvents="none"
        intensity={intensity}
        tint={dark ? 'dark' : 'light'}
        blurMethod="dimezisBlurViewSdk31Plus"
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: dark ? 'rgba(20,28,24,0.55)' : 'rgba(255,255,255,0.62)' }]} />
      {children}
    </View>
  );
}
