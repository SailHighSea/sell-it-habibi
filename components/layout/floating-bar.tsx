import { Ionicons } from '@expo/vector-icons';
import { router, usePathname, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Frost } from '@/components/ui/frost';
import { NAV_ITEMS } from '@/constants/navigation';
import { activeTokens } from '@/constants/palettes';
import { useIsDark } from '@/hooks/use-is-dark';
import { useIsWideScreen } from '@/hooks/use-is-wide-screen';
import { withAlpha } from '@/lib/color';
import { useInbox } from '@/providers/inbox-provider';
import { usePrefs } from '@/providers/prefs-provider';

/** Vertical space the bar takes (the pill plus its margins), so floating controls can sit just above it. */
export const BOTTOM_BAR_HEIGHT = 90;

const TAB_PATHS: Record<string, string> = { index: '/', search: '/search', sell: '/sell', chats: '/chats', updates: '/updates', profile: '/profile' };

/**
 * The floating glass pill, as in the Family Expenses app: 74 px tall, rounded, the chosen tab in a lighter pill,
 * icon over label. It lives at the app root, beside the blur target rather than inside it, so on Android it can blur
 * the screens scrolling underneath. Shown only on the five main screens, on phones and narrow web.
 */
export function FloatingBar() {
  const { t, setupDone } = usePrefs();
  const wide = useIsWideScreen();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const dark = useIsDark();
  const { chats, updates } = useInbox();
  const tokens = activeTokens();

  const items = NAV_ITEMS.filter((n) => n.inBottomBar);
  const onMainScreen = Object.values(TAB_PATHS).includes(pathname);
  if (wide || !setupDone || !onMainScreen) return null;

  const badges: Record<string, number> = { chats, updates };
  return (
    <View pointerEvents="box-none" className="absolute inset-x-0 bottom-0 px-3.5 pt-1.5" style={{ paddingBottom: Math.max(insets.bottom, 0) + 10 }}>
      <Frost className="rounded-full" strength={1.25} intensity={100} blurAndroid>
        <View className="h-[74px] flex-row p-[5px]">
          {items.map((item) => {
            const path = TAB_PATHS[item.name];
            const selected = pathname === path;
            const label = t(item.labelKey);
            const count = badges[item.name] ?? 0;
            const color = selected ? tokens.text : tokens.muted;
            return (
              <Pressable
                key={item.name}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={count > 0 ? `${label}, ${count}` : label}
                onPress={() => !selected && router.navigate(path as Href)}
                className="flex-1 items-center justify-center gap-[3px] rounded-full px-1"
                style={{ backgroundColor: selected ? (dark ? 'rgba(255,255,255,0.18)' : withAlpha(tokens.primary, 0.16)) : 'transparent' }}>
                <View>
                  <Ionicons name={selected ? item.iconActive : item.icon} size={24} color={color} />
                  <Badge count={count} />
                </View>
                <Text numberOfLines={1} adjustsFontSizeToFit style={{ color, fontSize: 12, fontWeight: selected ? '700' : '500' }}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Frost>
    </View>
  );
}
