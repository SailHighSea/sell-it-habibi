import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { EmptyState } from '@/components/listings/empty-state';
import { ListingGrid } from '@/components/listings/listing-grid';
import { Avatar } from '@/components/ui/avatar';
import { Chip } from '@/components/ui/chip';
import { GradientHeader } from '@/components/ui/gradient-header';
import { TOP_LEVEL_SLUGS, categoryLabel } from '@/constants/categories';
import { APP_NAME } from '@/constants/theme';
import { useAsyncData } from '@/hooks/use-async-data';
import { useIsWideScreen } from '@/hooks/use-is-wide-screen';
import { rankForYou, tabQuery } from '@/lib/listing-query';
import type { FeedTab } from '@/lib/listing-types';
import { useAuth } from '@/providers/auth-provider';
import { useEngagement } from '@/providers/engagement-provider';
import { usePrefs } from '@/providers/prefs-provider';
import { searchListings } from '@/services/listings';

const TABS: FeedTab[] = ['forYou', 'top', 'nearby', 'free', 'following'];

export default function HomeScreen() {
  const { t, country, language } = usePrefs();
  const { status, profile } = useAuth();
  const { followingIds } = useEngagement();
  const wide = useIsWideScreen();
  const [tab, setTab] = useState<FeedTab>('forYou');
  const [category, setCategory] = useState<string | undefined>();

  const signedIn = status === 'signedIn';
  const city = profile?.city?.trim() || null;
  const interests = profile?.interests ?? [];
  const blocked = (tab === 'nearby' && !city) || (tab === 'following' && !signedIn);

  const { data, failed, loading, reload } = useAsyncData(
    `feed|${country.code}|${tab}|${category ?? ''}|${city ?? ''}|${followingIds.join(',')}|${interests.join(',')}`,
    async () => {
      if (blocked) return [];
      const list = await searchListings({ country: country.code, category, ...tabQuery(tab, { city, followingIds }) });
      return tab === 'forYou' ? rankForYou(list, interests) : list;
    },
  );

  const emptyMessage =
    tab === 'nearby' && !city ? (
      <EmptyState
        message={t('feed.nearbyNeedsCity')}
        actionLabel={signedIn ? t('feed.addCity') : t('auth.signIn')}
        onAction={() => router.push(signedIn ? '/edit-profile' : '/sign-in')}
      />
    ) : tab === 'following' && !signedIn ? (
      <EmptyState message={t('feed.followingSignIn')} actionLabel={t('auth.signIn')} onAction={() => router.push('/sign-in')} />
    ) : tab === 'following' ? (
      <EmptyState message={t('feed.followingEmpty')} />
    ) : failed ? (
      <EmptyState message={t('home.loadFailed')} actionLabel={t('common.retry')} onAction={reload} />
    ) : (
      <EmptyState message={t('home.empty')} />
    );

  const header = (
    <View className="-mx-4 mb-1 gap-3">
      {wide ? null : (
        <GradientHeader>
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-black">
            <Ionicons name="pricetag" size={18} color="#F2B84B" />
          </View>
          <Text className="flex-1 text-lg font-bold text-white">{APP_NAME}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('nav.search')}
            onPress={() => router.push('/(tabs)/search')}
            className="h-11 w-11 items-center justify-center">
            <Ionicons name="search" size={22} color="#FFFFFF" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('nav.profile')}
            onPress={() => router.push(signedIn ? '/(tabs)/profile' : '/sign-in')}>
            <Avatar name={profile?.displayName ?? '?'} uri={profile?.avatarUrl} size={36} />
          </Pressable>
        </GradientHeader>
      )}
      <Text accessibilityRole="header" className="px-4 pt-2 text-2xl font-extrabold text-ink dark:text-ink-dark">
        {t('home.title')}
      </Text>
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
    <View className="flex-1 bg-canvas dark:bg-canvas-dark">
      <ListingGrid data={data ?? []} header={header} empty={loading ? <ActivityIndicator className="mt-10" /> : emptyMessage} />
    </View>
  );
}
