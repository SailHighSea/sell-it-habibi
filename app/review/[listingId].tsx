import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { EmptyState } from '@/components/listings/empty-state';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { StarInput } from '@/components/ui/stars';
import { TextField } from '@/components/ui/text-field';
import { useAsyncData } from '@/hooks/use-async-data';
import { useAuth } from '@/providers/auth-provider';
import { useInbox } from '@/providers/inbox-provider';
import { usePrefs } from '@/providers/prefs-provider';
import { getReviewState, submitReview } from '@/services/reviews';

export default function ReviewScreen() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const { t } = usePrefs();
  const { user } = useAuth();
  const { refresh } = useInbox();
  const state = useAsyncData(`review|${listingId}|${user?.id}`, () => getReviewState(user?.id ?? '', listingId));
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (rating < 1) return setError(t('review.pickRating'));
    setError(null);
    setBusy(true);
    try {
      await submitReview(user?.id ?? '', listingId, rating, comment);
      setDone(true);
      refresh();
    } catch (e) {
      setError(e instanceof Error && e.message.includes('already_reviewed') ? t('review.already') : t('review.failed'));
    } finally {
      setBusy(false);
    }
  };

  const s = state.data;
  return (
    <Screen title={t('review.title')} footer={s?.canReview && !done ? <Button label={t('review.submit')} onPress={submit} loading={busy} /> : undefined}>
      {state.loading ? (
        <ActivityIndicator className="mt-10" />
      ) : done ? (
        <View className="gap-4">
          <Text className="text-center text-lg font-bold text-ink dark:text-ink-dark">{t('review.thanks')}</Text>
          <Button label={t('common.back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        </View>
      ) : !s || !s.canReview ? (
        <EmptyState message={s?.reviewed ? t('review.already') : t('review.notAllowed')} />
      ) : (
        <>
          <Text className="text-xl font-bold text-ink dark:text-ink-dark">{t('review.intro', { name: s.sellerName ?? t('seller.title') })}</Text>
          {s.listingTitle ? <Text className="text-sm text-muted dark:text-muted-dark">{t('review.item', { title: s.listingTitle })}</Text> : null}
          <StarInput value={rating} onChange={(n) => { setRating(n); setError(null); }} />
          <TextField
            label={t('review.comment')}
            value={comment}
            onChangeText={setComment}
            placeholder={t('review.commentPlaceholder')}
            multiline
            maxLength={500}
            className="min-h-28 pt-3"
            style={{ textAlignVertical: 'top' }}
            error={error}
          />
        </>
      )}
    </Screen>
  );
}
