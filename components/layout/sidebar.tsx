import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, Text, View } from 'react-native';

import { APP_NAME } from '@/constants/theme';
import { useT } from '@/providers/prefs-provider';

import { buildNavEntries } from './nav-button-props';

/** Forest-green sidebar, as in the Family Expenses desktop layout. */
export function Sidebar(props: BottomTabBarProps) {
  const t = useT();
  const entries = buildNavEntries(props);

  return (
    <View className="w-64 bg-hero px-4 py-6 dark:bg-hero-dark">
      <View className="mb-8 flex-row items-center gap-2 px-2">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-black">
          <Ionicons name="pricetag" size={18} color="#F2B84B" />
        </View>
        <Text className="text-lg font-extrabold text-white">{APP_NAME}</Text>
      </View>

      <View className="gap-1">
        {entries.map(({ key, item, focused, onPress }) => {
          const isSell = item.name === 'sell';
          return (
            <Pressable
              key={key}
              accessibilityRole="link"
              accessibilityState={{ selected: focused }}
              onPress={onPress}
              className={[
                'min-h-12 flex-row items-center gap-3 rounded-2xl px-3',
                isSell ? 'bg-brand-400' : focused ? 'bg-hero-track' : '',
              ].join(' ')}>
              <Ionicons
                name={focused ? item.iconActive : item.icon}
                size={22}
                color={isSell ? '#0E1512' : focused ? '#FFFFFF' : '#BFD8CC'}
              />
              <Text
                className={[
                  'text-base',
                  isSell ? 'font-bold text-canvas-dark' : focused ? 'font-bold text-white' : 'font-medium text-hero-muted',
                ].join(' ')}>
                {t(item.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
