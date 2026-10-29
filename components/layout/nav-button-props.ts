import type { BottomTabBarProps } from 'expo-router/js-tabs';

import { NAV_ITEMS, type NavItem } from '@/constants/navigation';

export type NavEntry = {
  key: string;
  item: NavItem;
  focused: boolean;
  onPress: () => void;
};

/** Turns react-navigation tab state into a flat list the bar/sidebar can render. */
export function buildNavEntries({ state, navigation }: BottomTabBarProps): NavEntry[] {
  return state.routes.flatMap((route, index) => {
    const item = NAV_ITEMS.find((n) => n.name === route.name);
    if (!item) return [];
    const focused = state.index === index;
    const onPress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };
    return [{ key: route.key, item, focused, onPress }];
  });
}
