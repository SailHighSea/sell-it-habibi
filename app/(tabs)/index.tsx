import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Chip } from '@/components/ui/chip';
import { GradientHeader } from '@/components/ui/gradient-header';
import { ListingCard } from '@/components/ui/listing-card';
import { APP_NAME } from '@/constants/theme';
import { useGridColumns } from '@/hooks/use-grid-columns';
import { useIsWideScreen } from '@/hooks/use-is-wide-screen';
import { useAuth } from '@/providers/auth-provider';
import { usePrefs } from '@/providers/prefs-provider';
import { CATEGORIES, fetchListings, type Listing } from '@/services/listings';
import { router } from 'expo-router';

export default function HomeScreen() {
  const { t, country } = usePrefs();
  const { status, profile } = useAuth();
  const [listings, setListings] = useState<Listing[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const columns = useGridColumns();
  const wide = useIsWideScreen();

  useEffect(() => {
    let cancelled = false;
    fetchListings(country.code)
      .then((l) => !cancelled && (setFailed(false), setListings(l)))
      .catch(() => !cancelled && (setFailed(true), setListings([])));
    return () => {
      cancelled = true;
    };
  }, [country.code, attempt]);

  return (
    <View className="flex-1 bg-canvas dark:bg-canvas-dark">
      <FlatList
        key={columns} // numColumns can't change on a mounted list
        data={listings ?? []}
        numColumns={columns}
        keyExtractor={(l) => l.id}
        contentContainerClassName="gap-3 px-4 pb-6"
        columnWrapperClassName="gap-3"
        ListHeaderComponent={
          <View className="-mx-4 mb-1 gap-3">
            {wide ? null : (
              <GradientHeader>
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-black">
                  <Ionicons name="pricetag" size={18} color="#F2B84B" />
                </View>
                <Text className="flex-1 text-lg font-bold text-white">{APP_NAME}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('nav.profile')}
                  onPress={() => (status === 'signedIn' ? router.push('/(tabs)/profile') : router.push('/sign-in'))}>
                  <Avatar name={profile?.displayName ?? '?'} uri={profile?.avatarUrl} size={36} />
                </Pressable>
              </GradientHeader>
            )}
            <Text accessibilityRole="header" className="px-4 pt-2 text-2xl font-extrabold text-ink dark:text-ink-dark">
              {t('home.title')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-4">
              {CATEGORIES.map((slug) => (
                <Chip key={slug} label={t(`cat.${slug}`)} />
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          listings === null ? (
            <ActivityIndicator className="mt-10" />
          ) : failed ? (
            <Pressable accessibilityRole="button" onPress={() => setAttempt((a) => a + 1)} className="mt-10 items-center">
              <Text className="text-muted dark:text-muted-dark">{t('home.loadFailed')}</Text>
              <Text className="mt-2 font-bold text-brand-600 dark:text-brand-400">{t('common.retry')}</Text>
            </Pressable>
          ) : (
            <Text className="mt-10 text-center text-muted dark:text-muted-dark">{t('home.empty')}</Text>
          )
        }
        renderItem={({ item }) => <ListingCard listing={item} />}
      />
    </View>
  );
}
