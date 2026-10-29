import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

import { EmptyState } from '@/components/listings/empty-state';
import { ListingGrid } from '@/components/listings/listing-grid';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ListScreen } from '@/components/ui/screen';
import { useAsyncData } from '@/hooks/use-async-data';
import { useAuth } from '@/providers/auth-provider';
import { useEngagement } from '@/providers/engagement-provider';
import { usePrefs } from '@/providers/prefs-provider';
import { searchListings } from '@/services/listings';
import { getSeller } from '@/services/profile';

export default function SellerPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, country } = usePrefs();
  const { user } = useAuth();
  const { isFollowing, toggleFollow } = useEngagement();
  const seller = useAsyncData(`seller|${id}`, () => getSeller(id));
  const listings = useAsyncData(`seller-listings|${id}|${country.code}`, () => searchListings({ sellerId: id, country: country.code }));

  const header = seller.data ? (
    <View className="mx-auto mb-3 w-full max-w-lg flex-row items-center gap-3 rounded-card bg-surface p-4 dark:bg-surface-dark">
      <Avatar name={seller.data.displayName} uri={seller.data.avatarUrl} size={56} />
      <View className="flex-1 gap-0.5">
        <Text className="text-lg font-bold text-ink dark:text-ink-dark">{seller.data.displayName ?? t('seller.title')}</Text>
        <Text className="text-xs text-muted dark:text-muted-dark">
          {[seller.data.phoneVerified ? t('profile.phoneVerified') : null, seller.data.city].filter(Boolean).join(' · ')}
        </Text>
      </View>
      {user?.id === id ? null : (
        <Button
          variant={isFollowing(id) ? 'outline' : 'primary'}
          label={isFollowing(id) ? t('listing.following') : t('listing.follow')}
          onPress={() => toggleFollow(id)}
          className="min-h-11 px-4"
        />
      )}
    </View>
  ) : undefined;

  return (
    <ListScreen title={t('seller.title')}>
      <ListingGrid
        data={listings.data ?? []}
        header={header}
        empty={listings.loading ? <ActivityIndicator className="mt-10" /> : <EmptyState message={t('seller.noListings')} />}
      />
    </ListScreen>
  );
}
