import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Blue-to-green header from the Family Expenses Home. `children` sit on top; pass `overlap` to let the next card ride up over it. */
export function GradientHeader({ children, overlap = 0 }: { children: ReactNode; overlap?: number }) {
  const dark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={dark ? ['#15496F', '#17664F'] : ['#1D6FA6', '#1F9A78']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0.4 }}
      style={{ paddingTop: insets.top + 12, paddingBottom: 16 + overlap, paddingHorizontal: 16 }}>
      <View className="flex-row items-center gap-3">{children}</View>
    </LinearGradient>
  );
}
