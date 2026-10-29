import { Tabs } from 'expo-router/js-tabs';

import { ResponsiveTabBar } from '@/components/layout/responsive-tab-bar';
import { WebHeader } from '@/components/layout/web-header';
import { NAV_ITEMS } from '@/constants/navigation';
import { useIsWideScreen } from '@/hooks/use-is-wide-screen';
import { useT } from '@/providers/prefs-provider';

export default function TabsLayout() {
  const isWide = useIsWideScreen();
  const t = useT();

  return (
    <Tabs
      tabBar={(props) => <ResponsiveTabBar {...props} />}
      screenOptions={{
        // Sidebar sits at the start edge on wide web; bottom bar everywhere else.
        tabBarPosition: isWide ? 'left' : 'bottom',
        // Search/header strip only on wide web; mobile screens draw their own headers.
        headerShown: isWide,
        header: () => <WebHeader />,
      }}>
      {NAV_ITEMS.map((item) => (
        <Tabs.Screen key={item.name} name={item.name} options={{ title: t(item.labelKey) }} />
      ))}
    </Tabs>
  );
}
