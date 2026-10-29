import { Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Stars } from '@/components/ui/stars';
import { timeAgo } from '@/lib/time';
import { usePrefs } from '@/providers/prefs-provider';
import type { Review } from '@/services/reviews';

export function ReviewList({ reviews }: { reviews: Review[] }) {
  const { t, language } = usePrefs();
  if (reviews.length === 0) return <Text className="text-sm text-muted dark:text-muted-dark">{t('reviews.none')}</Text>;
  return (
    <View className="gap-3">
      {reviews.map((r) => (
        <View key={r.id} className="gap-1.5 rounded-card-sm bg-surface p-3 dark:bg-surface-dark">
          <View className="flex-row items-center gap-2">
            <Avatar name={r.reviewer?.displayName} uri={r.reviewer?.avatarUrl} size={32} />
            <View className="flex-1">
              <Text numberOfLines={1} className="text-sm font-semibold text-ink dark:text-ink-dark">
                {t('reviews.by', { name: r.reviewer?.displayName ?? t('updates.someone'), title: r.listingTitle })}
              </Text>
              <View className="flex-row items-center gap-2">
                <Stars value={r.rating} size={12} />
                <Text className="text-xs text-muted dark:text-muted-dark">{timeAgo(r.createdAt, language)}</Text>
              </View>
            </View>
          </View>
          {r.comment ? <Text className="text-sm text-ink dark:text-ink-dark">{r.comment}</Text> : null}
        </View>
      ))}
    </View>
  );
}
