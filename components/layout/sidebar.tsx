import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, Text, View } from 'react-native';

import { APP_NAME, Colors } from '@/constants/theme';

import { buildNavEntries } from './nav-button-props';

export function Sidebar(props: BottomTabBarProps) {
  const entries = buildNavEntries(props);

  return (
    <View className="w-64 border-r border-slate-200 bg-white px-4 py-6 dark:border-slate-700 dark:bg-slate-900">
      <View className="mb-8 flex-row items-center gap-2 px-2">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-brand-600">
          <Ionicons name="pricetag" size={20} color="white" />
        </View>
        <Text className="text-lg font-extrabold text-brand-700 dark:text-brand-500">{APP_NAME}</Text>
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
                'flex-row items-center gap-3 rounded-xl px-3 py-3',
                isSell ? 'bg-brand-600' : focused ? 'bg-brand-50 dark:bg-slate-800' : '',
              ].join(' ')}>
              <Ionicons
                name={focused ? item.iconActive : item.icon}
                size={22}
                color={isSell ? 'white' : focused ? Colors.primary : Colors.inactive}
              />
              <Text
                className={[
                  'text-base font-semibold',
                  isSell
                    ? 'text-white'
                    : focused
                      ? 'text-brand-700 dark:text-brand-500'
                      : 'text-slate-600 dark:text-slate-300',
                ].join(' ')}>
                {item.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
