import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOTTOM_BAR_HEIGHT } from '@/components/layout/bottom-bar';
import { useIsWideScreen } from '@/hooks/use-is-wide-screen';

/** Bottom padding that lets a tab screen's content scroll clear of the floating bar (0 under the sidebar). */
export function useBarInset(): number {
  const wide = useIsWideScreen();
  const insets = useSafeAreaInsets();
  return wide ? 0 : BOTTOM_BAR_HEIGHT + Math.max(insets.bottom, 8) + 24;
}
