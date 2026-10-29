import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { activeHeader } from '@/constants/palettes';
/** Blue-to-green header from the Family Expenses Home. `children` sit on top; pass `overlap` to let the next card ride up over it. */
export function GradientHeader({ children, overlap = 0, footer }: { children: ReactNode; overlap?: number; footer?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={activeHeader()}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0.4 }}
      style={{ paddingTop: insets.top + 12, paddingBottom: 16 + overlap, paddingHorizontal: 16, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
      <View className="flex-row items-center gap-3">{children}</View>
      {footer ? <View className="mt-3">{footer}</View> : null}
    </LinearGradient>
  );
}
