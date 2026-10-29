import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { activePalette } from '@/constants/palettes';
import { useIsDark } from '@/hooks/use-is-dark';
import { usePrefs } from '@/providers/prefs-provider';

type Props = {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  /** Blur strength, 1 to 100. */
  intensity?: number;
  /** How much of the tint covers the blur (0 to 1). The bar uses a light cover; sheets full of text use a heavy one. */
  cover?: number;
};

const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
};

// Android only blurs cheaply (a hardware RenderEffect) from Android 12; older phones get a more solid tint instead.
const CAN_BLUR = Platform.OS !== 'android' || (typeof Platform.Version === 'number' && Platform.Version >= 31);

/**
 * Floating chrome (tab bar, pinned footers, sheets). Frosted look: what is behind it is strongly blurred and darkened
 * under a mostly opaque tint, so it reads as a smoked-glass panel and text on it stays legible. Classic look: a flat
 * solid surface with a plain border. Blur is used only here, never on list items, to keep scrolling smooth.
 * Callers supply shape (rounded-*) and padding.
 */
export function Frost({ children, className = '', style, intensity = 90, cover = 0.78 }: Props) {
  const { look, appearance } = usePrefs();
  const dark = useIsDark();
  const shadow = { shadowColor: '#000', shadowOpacity: dark ? 0.4 : 0.16, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6 };

  if (look !== 'frosted') {
    return (
      <View className={`overflow-hidden border border-line bg-surface dark:border-line-dark dark:bg-surface-dark ${className}`} style={[{ ...shadow, shadowOpacity: shadow.shadowOpacity * 0.7, elevation: 4 }, style]}>
        {children}
      </View>
    );
  }

  const n = activePalette().neutrals;
  const base = appearance === 'black' ? '#141414' : dark ? n.surface[1] : n.surface[0];
  // Without a real blur behind it, the tint has to do more of the work.
  const alpha = CAN_BLUR ? cover : Math.max(cover, 0.94);
  return (
    <View className={`overflow-hidden border ${dark ? 'border-white/15' : 'border-white/80'} ${className}`} style={[shadow, style]}>
      {CAN_BLUR ? (
        <BlurView pointerEvents="none" intensity={intensity} tint={dark ? 'dark' : 'light'} blurMethod="dimezisBlurViewSdk31Plus" style={StyleSheet.absoluteFill} />
      ) : null}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: rgba(base, alpha) }]} />
      {/* soft highlight along the top edge, like light catching glass */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.9)' }} />
      {children}
    </View>
  );
}
