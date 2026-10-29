import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { BackdropLayer } from '@/components/ui/backdrop-layer';
import { EmptyState } from '@/components/listings/empty-state';
import { ListingGrid } from '@/components/listings/listing-grid';
import { NearbyCard } from '@/components/location/nearby-card';
import { Avatar } from '@/components/ui/avatar';
import { Chip } from '@/components/ui/chip';
import { GradientHeader } from '@/components/ui/gradient-header';
import { Logo } from '@/components/ui/logo';
import { TOP_LEVEL_SLUGS, categoryLabel } from '@/constants/categories';
import { APP_NAME, Colors } from '@/constants/theme';
import { usePagedListings } from '@/hooks/use-paged-listings';
import { useIsWideScreen } from '@/hooks/use-is-wide-screen';
import { pickName } from '@/lib/names';
import { rankForYou, tabQuery } from '@/lib/listing-query';
import type { FeedTab } from '@/lib/listing-types';
import { useAuth } from '@/providers/auth-provider';
import { useEngagement } from '@/providers/engagement-provider';
import { useLocation } from '@/providers/location-provider';
import { usePrefs } from '@/providers/prefs-provider';
import { searchListings } from '@/services/listings';

const TABS: FeedTab[] = ['forYou', 'top', 'nearby', 'free', 'following'];

export default function HomeScreen() {
  const { t, country, language } = usePrefs();
  const { status, profile } = useAuth();
  const { followingIds } = useEngagement();
  const { city, origin, radiusKm } = useLocation();
  const wide = useIsWideScreen();
  const [tab, setTab] = useState<FeedTab>('forYou');
  const [category, setCategory] = useState<string | undefined>();

  const signedIn = status === 'signedIn';
  const interests = profile?.interests ?? [];
  const cityName = pickName(city, language);

  const feed = usePagedListings(
    `feed|${country.code}|${tab}|${category ?? ''}|${origin.lat.toFixed(3)},${origin.lng.toFixed(3)}|${radiusKm}|${followingIds.join(',')}`,
    (offset, limit) =>
      searchListings({ country: country.code, category, offset, limit, ...tabQuery(tab, { near: { ...origin, radiusKm }, followingIds }) }),
  );
  const data = tab === 'forYou' ? rankForYou(feed.items, interests) : feed.items;

  const emptyMessage =
    tab === 'nearby' ? (
      <EmptyState message={t('feed.nearbyEmpty', { km: radiusKm, city: cityName })} />
    ) : tab === 'following' ? (
      <EmptyState message={t('feed.followingEmpty')} />
    ) : feed.failed ? (
      <EmptyState message={t('home.loadFailed')} actionLabel={t('common.retry')} onAction={feed.reload} />
    ) : (
      <EmptyState message={t('home.empty')} />
    );

  const header = (
    <View className="-mx-4 mb-1 gap-3">
      {wide ? null : (
        <>
          <GradientHeader
            overlap={32}
            footer={
              <Pressable
                accessibilityRole="search"
                accessibilityLabel={t('nav.search')}
                onPress={() => router.push('/(tabs)/search')}
                className="min-h-12 flex-row items-center gap-2 rounded-full bg-white px-4">
                <Ionicons name="search" size={18} color={Colors.inactive} />
                <Text numberOfLines={1} className="flex-1 text-base text-[#55645D]">
                  {t('home.searchPlaceholder')}
                </Text>
              </Pressable>
            }>
            <Logo size={40} />
            <View className="flex-1">
              <Text className="text-lg font-bold text-white">{APP_NAME}</Text>
              <Text numberOfLines={1} className="text-xs text-white/85">
                {t('home.tagline')}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('nav.profile')}
              onPress={() => router.push(signedIn ? '/(tabs)/profile' : '/sign-in')}>
              <Avatar name={profile?.displayName ?? '?'} uri={profile?.avatarUrl} size={40} />
            </Pressable>
          </GradientHeader>
        </>
      )}
      <View className={wide ? '' : '-mt-9'}>
        <NearbyCard />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-5 px-4" accessibilityRole="tablist">
        {TABS.map((id) => (
          <Pressable
            key={id}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === id }}
            onPress={() => setTab(id)}
            className={`min-h-11 justify-center border-b-2 ${tab === id ? 'border-brand-600 dark:border-brand-400' : 'border-transparent'}`}>
            <Text className={`text-sm font-semibold ${tab === id ? 'text-brand-600 dark:text-brand-400' : 'text-muted dark:text-muted-dark'}`}>
              {t(`feed.${id}`)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-4">
        <Chip label={t('feed.all')} selected={!category} onPress={() => setCategory(undefined)} />
        {TOP_LEVEL_SLUGS.map((slug) => (
          <Chip key={slug} label={categoryLabel(slug, language)} selected={category === slug} onPress={() => setCategory(category === slug ? undefined : slug)} />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View className="flex-1">
      <BackdropLayer />
      <ListingGrid
        underBar
        data={data}
        header={header}
        onEnd={feed.loadMore}
        footer={feed.loading || feed.done ? null : <ActivityIndicator className="my-4" />}
        empty={feed.loading ? <ActivityIndicator className="mt-10" /> : emptyMessage}
      />
    </View>
  );
}
