import type { BottomTabBarProps } from 'expo-router/js-tabs';

import { useIsWideScreen } from '@/hooks/use-is-wide-screen';

import { Sidebar } from './sidebar';

/** Left sidebar on wide web. On phones and narrow web the floating bar (components/layout/floating-bar.tsx) is drawn at the app root instead. */
export function ResponsiveTabBar(props: BottomTabBarProps) {
  return useIsWideScreen() ? <Sidebar {...props} /> : null;
}
