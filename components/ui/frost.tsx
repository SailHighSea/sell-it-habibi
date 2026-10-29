import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { activeTokens } from '@/constants/palettes';
import { useBlurTarget } from '@/components/ui/blur-target';
import { useIsDark } from '@/hooks/use-is-dark';
import { withAlpha } from '@/lib/color';
import { glassSheen } from '@/lib/glass';
import { usePrefs } from '@/providers/prefs-provider';

type Props = {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  /** Blur strength, 1 to 100. On Android the radius is this divided by 4, so 100 is about the expenses app's blur (sigma 22). */
  intensity?: number;
  /** 1 is the card tint; bars and sheets with small text use more (capped so the background still shows through). */
  strength?: number;
  /** Android can only blur from the floating bar (it sits beside the blur target, not inside it); elsewhere it gets a stronger tint instead. */
  blurAndroid?: boolean;
};

// Android blurs cheaply (a hardware effect) from Android 12 and only with a blur target; otherwise the tint does the work.
const ANDROID_BLUR_OK = typeof Platform.Version === 'number' && Platform.Version >= 31;

/**
 * Floating chrome (tab bar, pinned footers, sheets), glass as in the Family Expenses app: a see-through tint of the nav colour,
 * a soft light sheen from the top left, a thin light edge, and a blur of whatever scrolls behind. The blur is only on the bar,
 * never on list cards (those use the same tint without it), to keep scrolling smooth.
 * Classic look: a flat solid surface with a plain border. Callers supply shape (rounded-*) and padding.
 */
export function Frost({ children, className = '', style, intensity = 100, strength = 1.25, blurAndroid = false }: Props) {
  const { look } = usePrefs();
  const dark = useIsDark();
  const blurTarget = useBlurTarget();
  const shadow = { shadowColor: '#000', shadowOpacity: dark ? 0.4 : 0.14, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6 };

  if (look !== 'frosted') {
    return (
      <View className={`overflow-hidden border border-line bg-surface dark:border-line-dark dark:bg-surface-dark ${className}`} style={[{ ...shadow, shadowOpacity: shadow.shadowOpacity * 0.7, elevation: 4 }, style]}>
        {children}
      </View>
    );
  }

  const blurs = Platform.OS !== 'android' || (blurAndroid && ANDROID_BLUR_OK && !!blurTarget);
  const tint = Math.min((dark ? 0.58 : 0.64) * strength, 0.88);
  // Without a real blur behind it, the tint has to do more of the work.
  const alpha = blurs ? tint : Math.max(tint, 0.92);
  return (
    <View className={`overflow-hidden border ${className}`} style={[shadow, { borderColor: dark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.55)' }, style]}>
      {blurs ? (
        <BlurView
          pointerEvents="none"
          intensity={intensity}
          tint={dark ? 'dark' : 'light'}
          blurMethod="dimezisBlurViewSdk31Plus"
          blurTarget={blurTarget ?? undefined}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: withAlpha(activeTokens().navRail, alpha) }]} />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, glassSheen(dark)]} />
      {children}
    </View>
  );
}
