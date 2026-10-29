import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { usePrefs } from '@/providers/prefs-provider';
import { formatMinor } from '@/lib/money';
import type { Listing } from '@/services/listings';

export function ListingCard({ listing }: { listing: Listing }) {
  const { locale } = usePrefs();
  return (
    <View className="flex-1 overflow-hidden rounded-card-sm border border-line bg-surface dark:border-line-dark dark:bg-surface-dark">
      <View className="aspect-square items-center justify-center bg-brand-100 dark:bg-hero-dark">
        <Ionicons name="image-outline" size={36} color="#9AA8A1" />
      </View>
      <View className="gap-1 p-3">
        <Text className="text-base font-bold text-ink dark:text-ink-dark">{formatMinor(listing.priceMinor, listing.currency, locale)}</Text>
        <Text numberOfLines={2} className="text-sm text-ink dark:text-ink-dark">
          {listing.title}
        </Text>
        <Text className="text-xs text-muted dark:text-muted-dark">{listing.location}</Text>
      </View>
    </View>
  );
}
