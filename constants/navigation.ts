import type { Ionicons } from '@expo/vector-icons';

export type IconName = keyof typeof Ionicons.glyphMap;

export type NavItem = {
  /** Must match the file name inside app/(tabs)/ */
  name: 'index' | 'search' | 'sell' | 'chats' | 'profile';
  title: string;
  icon: IconName;
  iconActive: IconName;
};

export const NAV_ITEMS: NavItem[] = [
  { name: 'index', title: 'Home', icon: 'home-outline', iconActive: 'home' },
  { name: 'search', title: 'Search', icon: 'search-outline', iconActive: 'search' },
  { name: 'sell', title: 'Sell', icon: 'add-circle-outline', iconActive: 'add-circle' },
  { name: 'chats', title: 'Chats', icon: 'chatbubbles-outline', iconActive: 'chatbubbles' },
  { name: 'profile', title: 'Profile', icon: 'person-outline', iconActive: 'person' },
];

/** Width (px) at which the web layout switches from bottom bar to sidebar. */
export const WIDE_BREAKPOINT = 768;
