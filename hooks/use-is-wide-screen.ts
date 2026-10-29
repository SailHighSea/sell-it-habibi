import { Platform, useWindowDimensions } from 'react-native';

import { WIDE_BREAKPOINT } from '@/constants/navigation';

/** True on web viewports wide enough for the sidebar layout. Native always gets the bottom bar. */
export function useIsWideScreen(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= WIDE_BREAKPOINT;
}
