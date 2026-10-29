import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOTTOM_BAR_HEIGHT } from '@/components/layout/bottom-bar';
import { ResponsiveTabBar } from '@/components/layout/responsive-tab-bar';
import { WebHeader } from '@/components/layout/web-header';
import { NAV_ITEMS } from '@/constants/navigation';
import { useIsWideScreen } from '@/hooks/use-is-wide-screen';
import { useAuth } from '@/providers/auth-provider';
import { useT } from '@/providers/prefs-provider';

export default function TabsLayout() {
  const isWide = useIsWideScreen();
  const t = useT();
  const { status } = useAuth();
  const insets = useSafeAreaInsets();
  const dark = useColorScheme() === 'dark';

  return (
    <View className="flex-1">
      <Tabs
        tabBar={(props) => <ResponsiveTabBar {...props} />}
        screenOptions={{
          // Sidebar sits at the start edge on wide web; bottom bar everywhere else.
          tabBarPosition: isWide ? 'left' : 'bottom',
          // On phones the bar floats over the screens (they pad their content with useBarInset) so it can frost them.
          tabBarStyle: isWide ? undefined : { position: 'absolute', backgroundColor: 'transparent', borderTopWidth: 0, elevation: 0 },
          // Search/header strip only on wide web; mobile screens draw their own headers.
          headerShown: isWide,
          header: () => <WebHeader />,
        }}>
        {NAV_ITEMS.map((item) => (
          <Tabs.Screen key={item.name} name={item.name} options={{ title: t(item.labelKey) }} />
        ))}
      </Tabs>

      {/* "+ Sell" floats above the bar on phones. The sidebar has its own Sell entry. */}
      {isWide ? null : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('nav.sell')}
          onPress={() => router.push(status === 'signedIn' ? '/listing/new' : '/sign-in')}
          className="absolute end-4 min-h-14 flex-row items-center gap-1.5 rounded-full border-[5px] border-black/30 bg-brand-600 px-5 dark:bg-brand-400"
          style={{ bottom: BOTTOM_BAR_HEIGHT + Math.max(insets.bottom, 8) }}>
          <Ionicons name="add" size={22} color={dark ? '#0E1512' : '#FFFFFF'} />
          <Text className="text-base font-bold text-white dark:text-canvas-dark">{t('nav.sell')}</Text>
        </Pressable>
      )}
    </View>
  );
}
