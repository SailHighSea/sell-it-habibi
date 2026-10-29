import type { Ionicons } from '@expo/vector-icons';

import type { TranslationKey } from '@/i18n';

export type IconName = keyof typeof Ionicons.glyphMap;

export type NavItem = {
  /** Must match the file name inside app/(tabs)/ */
  name: 'index' | 'search' | 'sell' | 'chats' | 'profile';
  labelKey: TranslationKey;
  icon: IconName;
  iconActive: IconName;
};

export const NAV_ITEMS: NavItem[] = [
  { name: 'index', labelKey: 'nav.home', icon: 'home-outline', iconActive: 'home' },
  { name: 'search', labelKey: 'nav.search', icon: 'search-outline', iconActive: 'search' },
  { name: 'sell', labelKey: 'nav.sell', icon: 'add-circle-outline', iconActive: 'add-circle' },
  { name: 'chats', labelKey: 'nav.chats', icon: 'chatbubbles-outline', iconActive: 'chatbubbles' },
  { name: 'profile', labelKey: 'nav.profile', icon: 'person-outline', iconActive: 'person' },
];

/** Width (px) at which the web layout switches from bottom bar to sidebar. */
export const WIDE_BREAKPOINT = 768;
