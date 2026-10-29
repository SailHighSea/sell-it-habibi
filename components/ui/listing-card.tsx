import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import type { Listing } from '@/services/listings';

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <View className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <View className="aspect-square items-center justify-center bg-brand-50 dark:bg-slate-700">
        <Ionicons name="image-outline" size={36} color="#94a3b8" />
      </View>
      <View className="gap-1 p-3">
        <Text numberOfLines={2} className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {listing.title}
        </Text>
        <Text className="text-base font-bold text-brand-700 dark:text-brand-500">
          {listing.currency} {listing.price.toLocaleString('en-US')}
        </Text>
        <Text className="text-xs text-slate-500 dark:text-slate-400">{listing.location}</Text>
      </View>
    </View>
  );
}
