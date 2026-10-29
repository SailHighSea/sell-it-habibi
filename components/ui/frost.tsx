import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useIsDark } from '@/hooks/use-is-dark';
import { usePrefs } from '@/providers/prefs-provider';

type Props = { children: ReactNode; className?: string; style?: StyleProp<ViewStyle>; intensity?: number };

/**
 * Floating chrome (tab bar, pinned footers, sheets). Frosted look: the content behind it shows through, blurred,
 * under a translucent tint and a hairline edge. Classic look: a flat solid surface with a plain border.
 * Callers supply shape (rounded-*) and padding.
 */
export function Frost({ children, className = '', style, intensity = 40 }: Props) {
  const { look } = usePrefs();
  const dark = useIsDark();
  const shadow = { shadowColor: '#000', shadowOpacity: dark ? 0.35 : 0.14, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 };

  if (look !== 'frosted') {
    return (
      <View className={`overflow-hidden border border-line bg-surface dark:border-line-dark dark:bg-surface-dark ${className}`} style={[{ ...shadow, shadowOpacity: shadow.shadowOpacity * 0.7, elevation: 4 }, style]}>
        {children}
      </View>
    );
  }
  return (
    <View className={`overflow-hidden border ${dark ? 'border-white/10' : 'border-white/70'} ${className}`} style={[shadow, style]}>
      <BlurView pointerEvents="none" intensity={intensity} tint={dark ? 'dark' : 'light'} blurMethod="dimezisBlurViewSdk31Plus" style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: dark ? 'rgba(20,28,24,0.55)' : 'rgba(255,255,255,0.62)' }]} />
      {children}
    </View>
  );
}
