import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { categoryLabel } from '@/constants/categories';
import { Colors } from '@/constants/theme';
import { formatMinor } from '@/lib/money';
import type { Listing } from '@/lib/listing-types';
import { timeAgo } from '@/lib/time';
import { useEngagement } from '@/providers/engagement-provider';
import { usePrefs } from '@/providers/prefs-provider';
import { imageUrl } from '@/services/listings';

export function ListingCard({ listing }: { listing: Listing }) {
  const { t, locale, language } = usePrefs();
  const { isFavorite, toggleFavorite } = useEngagement();
  const liked = isFavorite(listing.id);
  const cover = listing.imagePaths[0];
  const price = listing.type === 'free' ? t('listing.free') : formatMinor(listing.priceMinor, listing.currency, locale);

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${listing.title}, ${price}`}
      onPress={() => router.push(`/listing/${listing.id}`)}
      className="flex-1 overflow-hidden rounded-card-sm border border-line bg-surface dark:border-line-dark dark:bg-surface-dark">
      <View className="aspect-square items-center justify-center bg-brand-100 dark:bg-hero-dark">
        {cover ? (
          <Image source={{ uri: imageUrl(cover) }} style={{ width: '100%', height: '100%' }} contentFit="cover" accessibilityLabel={listing.title} />
        ) : (
          <Ionicons name="image-outline" size={36} color={Colors.placeholder} />
        )}
        {listing.status !== 'active' ? (
          <View className="absolute start-2 top-2 rounded-full bg-black/60 px-2 py-0.5">
            <Text className="text-[10px] font-semibold text-white">{t(`status.${listing.status}`)}</Text>
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t(liked ? 'listing.unlike' : 'listing.like')}
          accessibilityState={{ selected: liked }}
          onPress={() => toggleFavorite(listing.id)}
          hitSlop={8}
          className="absolute end-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-surface dark:bg-surface-dark">
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color={liked ? '#E5484D' : Colors.inactive} />
        </Pressable>
      </View>
      <View className="gap-0.5 p-3">
        <Text className="text-base font-bold text-ink dark:text-ink-dark">{price}</Text>
        <Text numberOfLines={2} className="text-sm text-ink dark:text-ink-dark">
          {listing.title}
        </Text>
        <Text numberOfLines={1} className="text-xs text-muted dark:text-muted-dark">
          {[t(`condition.${listing.condition}`), listing.city ?? categoryLabel(listing.categorySlug, language)].join(' · ')}
        </Text>
        <Text className="text-xs text-muted dark:text-muted-dark">{timeAgo(listing.bumpedAt, language)}</Text>
      </View>
    </Pressable>
  );
}
