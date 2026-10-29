import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { formatRating } from '@/lib/rating';
import { usePrefs } from '@/providers/prefs-provider';

const GOLD = '#F2B84B';

/** Five stars filled to the nearest half. */
export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <View className="flex-row" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {[1, 2, 3, 4, 5].map((i) => {
        const name = value >= i - 0.25 ? 'star' : value >= i - 0.75 ? 'star-half' : 'star-outline';
        return <Ionicons key={i} name={name} size={size} color={GOLD} />;
      })}
    </View>
  );
}

/** "★ 4.9 (38)", or "No reviews yet". */
export function RatingSummary({ avg, count, showEmpty = true }: { avg: number | null; count: number; showEmpty?: boolean }) {
  const { t, locale } = usePrefs();
  if (avg === null || count === 0) {
    return showEmpty ? <Text className="text-xs text-muted dark:text-muted-dark">{t('reviews.none')}</Text> : null;
  }
  return (
    <View className="flex-row items-center gap-1" accessible accessibilityLabel={`${formatRating(avg, locale)}, ${count}`}>
      <Ionicons name="star" size={13} color={GOLD} />
      <Text className="text-xs font-bold text-ink dark:text-ink-dark">{formatRating(avg, locale)}</Text>
      <Text className="text-xs text-muted dark:text-muted-dark">{`(${count})`}</Text>
    </View>
  );
}

/** Tap a star to choose 1 to 5. Each star is at least 44px wide. */
export function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const { t } = usePrefs();
  return (
    <View className="flex-row justify-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Pressable
          key={i}
          accessibilityRole="button"
          accessibilityLabel={t('review.starLabel', { n: i })}
          accessibilityState={{ selected: value === i }}
          onPress={() => onChange(i)}
          className="h-12 w-12 items-center justify-center">
          <Ionicons name={i <= value ? 'star' : 'star-outline'} size={34} color={GOLD} />
        </Pressable>
      ))}
    </View>
  );
}
