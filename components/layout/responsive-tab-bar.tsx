import type { BottomTabBarProps } from 'expo-router/js-tabs';

import { useIsWideScreen } from '@/hooks/use-is-wide-screen';

import { BottomBar } from './bottom-bar';
import { Sidebar } from './sidebar';

/** Bottom navigation on mobile / narrow web, left sidebar on wide web. */
export function ResponsiveTabBar(props: BottomTabBarProps) {
  return useIsWideScreen() ? <Sidebar {...props} /> : <BottomBar {...props} />;
}
