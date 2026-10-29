import type { ViewStyle } from 'react-native';

import { useIsDark } from '@/hooks/use-is-dark';
import { glassSheen } from '@/lib/glass';
import { usePrefs } from '@/providers/prefs-provider';

/** The glass sheen for a card in the Frosted look; nothing in Classic. */
export function useGlassSheen(): ViewStyle | undefined {
  const { look } = usePrefs();
  const dark = useIsDark();
  return look === 'frosted' ? glassSheen(dark) : undefined;
}
