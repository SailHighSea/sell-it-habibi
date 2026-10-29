import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Frost } from '@/components/ui/frost';
import { Colors } from '@/constants/theme';
import { useAsyncData } from '@/hooks/use-async-data';
import { pickName } from '@/lib/names';
import { formatNumber } from '@/lib/intl';
import { useLocation } from '@/providers/location-provider';
import { usePrefs } from '@/providers/prefs-provider';
import { nearbyStats } from '@/services/stats';

import { LocationSheet } from './location-sheet';

/** The Home location card: city with previous/next arrows, how far we look, and what is around. */
export function NearbyCard() {
  const { t, country, language, locale, rtl } = usePrefs();
  const { city, origin, radiusKm, usingGps, stepCity } = useLocation();
  const [open, setOpen] = useState(false);
  const name = pickName(city, language);

  const stats = useAsyncData(`stats|${country.code}|${origin.lat.toFixed(3)},${origin.lng.toFixed(3)}|${radiusKm}`, () =>
    nearbyStats(country.code, { ...origin, radiusKm }),
  );
  const s = stats.data;
  const num = (n: number | undefined) => (n === undefined ? '–' : formatNumber(n, locale, {}, () => String(n)));
  const left = rtl ? 'chevron-forward' : 'chevron-back';
  const right = rtl ? 'chevron-back' : 'chevron-forward';

  return (
    <View className="mx-4">
    <Frost className="gap-3 rounded-card p-4" strength={1} intensity={60} shadow={false}>
      <View className="flex-row items-center">
        <Pressable accessibilityRole="button" accessibilityLabel={t('loc.prev')} onPress={() => stepCity(-1)} className="h-11 w-11 items-center justify-center">
          <Ionicons name={left} size={22} color={Colors.primary} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t('loc.change')} onPress={() => setOpen(true)} className="min-h-11 flex-1 items-center justify-center">
          <Text className="text-lg font-extrabold text-ink dark:text-ink-dark">{name}</Text>
          <Text className="text-xs text-muted dark:text-muted-dark">
            {usingGps ? t('loc.withinYou', { km: radiusKm }) : t('loc.withinCity', { km: radiusKm, city: name })}
          </Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t('loc.next')} onPress={() => stepCity(1)} className="h-11 w-11 items-center justify-center">
          <Ionicons name={right} size={22} color={Colors.primary} />
        </Pressable>
      </View>
      <View className="h-px bg-line dark:bg-line-dark" />
      <View className="flex-row">
        <Stat label={t('loc.newToday')} value={num(s?.newToday)} />
        <Stat label={t('loc.free')} value={num(s?.free)} />
        <Stat label={t('loc.verified')} value={num(s?.verifiedSellers)} />
      </View>
      <LocationSheet visible={open} onClose={() => setOpen(false)} />
    </Frost>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 gap-0.5">
      <Text className="text-xs text-muted dark:text-muted-dark">{label}</Text>
      <Text className="text-xl font-extrabold text-ink dark:text-ink-dark">{value}</Text>
    </View>
  );
}
