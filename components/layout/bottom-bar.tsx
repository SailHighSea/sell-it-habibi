import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';

import { buildNavEntries } from './nav-button-props';

export function BottomBar(props: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const entries = buildNavEntries(props);

  return (
    <View
      className="flex-row border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}>
      {entries.map(({ key, item, focused, onPress }) => {
        const isSell = item.name === 'sell';
        const color = focused ? Colors.primary : Colors.inactive;
        return (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={item.title}
            onPress={onPress}
            className="flex-1 items-center justify-center gap-0.5 pt-2">
            <Ionicons
              name={focused ? item.iconActive : item.icon}
              size={isSell ? 36 : 24}
              color={isSell ? Colors.accent : color}
            />
            <Text className="text-[11px] font-medium" style={{ color }}>
              {item.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
