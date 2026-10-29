import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useT } from '@/providers/prefs-provider';

import { buildNavEntries } from './nav-button-props';

export function BottomBar(props: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const t = useT();
  const entries = buildNavEntries(props);

  return (
    <View
      className="flex-row border-t border-line bg-surface dark:border-line-dark dark:bg-surface-dark"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}>
      {entries.map(({ key, item, focused, onPress }) => {
        const isSell = item.name === 'sell';
        const color = focused ? Colors.primary : Colors.inactive;
        const label = t(item.labelKey);
        return (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            onPress={onPress}
            className="min-h-14 flex-1 items-center justify-center gap-0.5 pt-2">
            <Ionicons
              name={focused ? item.iconActive : item.icon}
              size={isSell ? 36 : 24}
              color={isSell ? Colors.accent : color}
            />
            <Text className="text-[11px] font-medium" style={{ color }}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
