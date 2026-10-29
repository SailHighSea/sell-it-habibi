import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Colors } from '@/constants/theme';
import { useInbox } from '@/providers/inbox-provider';
import { useT } from '@/providers/prefs-provider';

import { buildNavEntries } from './nav-button-props';

/** Vertical space the bar takes (pill plus its margins), so floating controls can sit just above it. */
export const BOTTOM_BAR_HEIGHT = 84;

/** Floating pill, as in the Family Expenses app: rounded capsule, active tab in a soft pill, icon over label. */
export function BottomBar(props: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const t = useT();
  const { chats, updates } = useInbox();
  const entries = buildNavEntries(props).filter((e) => e.item.inBottomBar);
  const badges: Record<string, number> = { chats, updates };

  return (
    <View className="bg-canvas px-3 pt-2 dark:bg-canvas-dark" style={{ paddingBottom: Math.max(insets.bottom, 8) + 4 }}>
      <View
        className="flex-row rounded-full border border-line bg-surface p-1.5 dark:border-line-dark dark:bg-surface-dark"
        style={{ elevation: 4, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }}>
        {entries.map(({ key, item, focused, onPress }) => {
          const label = t(item.labelKey);
          const count = badges[item.name] ?? 0;
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={count > 0 ? `${label}, ${count}` : label}
              onPress={onPress}
              className={`min-h-14 flex-1 items-center justify-center gap-0.5 rounded-full px-1 py-1.5 ${focused ? 'bg-brand-50 dark:bg-hero-dark' : ''}`}>
              <View>
                <Ionicons name={focused ? item.iconActive : item.icon} size={22} color={focused ? Colors.primary : Colors.inactive} />
                <Badge count={count} />
              </View>
              <Text numberOfLines={1} className={`text-[11px] ${focused ? 'font-bold text-brand-700 dark:text-brand-400' : 'font-medium text-muted dark:text-muted-dark'}`}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
