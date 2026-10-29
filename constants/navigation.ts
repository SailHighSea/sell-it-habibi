import type { Ionicons } from '@expo/vector-icons';

import type { TranslationKey } from '@/i18n';

export type IconName = keyof typeof Ionicons.glyphMap;

export type NavItem = {
  /** Must match the file name inside app/(tabs)/ */
  name: 'index' | 'search' | 'sell' | 'chats' | 'updates' | 'profile';
  labelKey: TranslationKey;
  icon: IconName;
  iconActive: IconName;
  /** Selling has its own floating button on phones, so it isn't a tab in the bottom bar. */
  inBottomBar: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { name: 'index', labelKey: 'nav.home', icon: 'home-outline', iconActive: 'home', inBottomBar: true },
  { name: 'search', labelKey: 'nav.search', icon: 'search-outline', iconActive: 'search', inBottomBar: true },
  { name: 'sell', labelKey: 'nav.sell', icon: 'add-circle-outline', iconActive: 'add-circle', inBottomBar: false },
  { name: 'chats', labelKey: 'nav.chats', icon: 'chatbubbles-outline', iconActive: 'chatbubbles', inBottomBar: true },
  { name: 'updates', labelKey: 'nav.updates', icon: 'notifications-outline', iconActive: 'notifications', inBottomBar: true },
  { name: 'profile', labelKey: 'nav.profile', icon: 'person-outline', iconActive: 'person', inBottomBar: true },
];

/** Width (px) at which the web layout switches from bottom bar to sidebar. */
export const WIDE_BREAKPOINT = 768;
