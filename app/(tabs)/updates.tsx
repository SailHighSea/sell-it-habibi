import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackdropLayer } from '@/components/ui/backdrop-layer';
import { EmptyState } from '@/components/listings/empty-state';
import { Avatar } from '@/components/ui/avatar';
import { Colors } from '@/constants/theme';
import { useBarInset } from '@/hooks/use-bar-inset';
import { useAsyncData } from '@/hooks/use-async-data';
import type { UpdateKind } from '@/lib/chat-types';
import { timeAgo } from '@/lib/time';
import { useAuth } from '@/providers/auth-provider';
import { useInbox } from '@/providers/inbox-provider';
import { usePrefs } from '@/providers/prefs-provider';
import { listUpdates, markAllUpdatesRead, markUpdateRead } from '@/services/updates';

const ICONS: Record<UpdateKind, keyof typeof Ionicons.glyphMap> = {
  message: 'chatbubble-ellipses',
  offer: 'pricetag',
  offer_accepted: 'checkmark-circle',
  offer_declined: 'close-circle',
  meetup: 'location',
  review_request: 'star',
  review: 'star-half',
  moderation: 'shield-checkmark',
};

export default function UpdatesScreen() {
  const { t, language } = usePrefs();
  const barInset = useBarInset();
  const { status, user } = useAuth();
  const { refresh } = useInbox();
  const signedIn = status === 'signedIn';
  const { data, loading, failed, reload } = useAsyncData(`updates|${user?.id ?? ''}`, () => (signedIn && user ? listUpdates(user.id) : Promise.resolve([])));
  const hasUnread = (data ?? []).some((u) => !u.read);

  return (
    <SafeAreaView edges={['top']} className="flex-1">
      <BackdropLayer />
      <View className="flex-row items-center justify-between px-5 pb-2 pt-3">
        <Text accessibilityRole="header" className="text-3xl font-extrabold text-ink dark:text-ink-dark">
          {t('updates.title')}
        </Text>
        {hasUnread && user ? (
          <Pressable
            accessibilityRole="button"
            onPress={async () => {
              await markAllUpdatesRead(user.id);
              reload();
              refresh();
            }}
            className="min-h-11 justify-center">
            <Text className="text-sm font-bold text-brand-600 dark:text-brand-400">{t('updates.markAll')}</Text>
          </Pressable>
        ) : null}
      </View>
      {!signedIn ? (
        <EmptyState message={t('updates.signIn')} actionLabel={t('auth.signIn')} onAction={() => router.push('/sign-in')} />
      ) : loading ? (
        <ActivityIndicator className="mt-10" />
      ) : failed ? (
        <EmptyState message={t('home.loadFailed')} actionLabel={t('common.retry')} onAction={reload} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(u) => u.id}
          contentContainerStyle={{ paddingBottom: barInset }}
          contentContainerClassName="mx-auto w-full max-w-lg gap-1 px-3 pb-6"
          ListEmptyComponent={<EmptyState message={t('updates.empty')} />}
          renderItem={({ item: u }) => (
            <Pressable
              accessibilityRole="link"
              onPress={async () => {
                if (user && !u.read) await markUpdateRead(user.id, u.id).catch(() => {});
                refresh();
                if (u.kind === 'review_request' && u.listingId) router.push(`/review/${u.listingId}`);
                else if (u.kind === 'review' && user) router.push(`/seller/${user.id}`);
                else if (u.kind === 'moderation') router.push('/my-listings');
                else if (u.threadId) router.push(`/thread/${u.threadId}`);
              }}
              className={`min-h-16 flex-row items-center gap-3 rounded-2xl px-3 py-2 ${u.read ? '' : 'bg-surface dark:bg-surface-dark'}`}>
              <View>
                <Avatar name={u.actor?.displayName} uri={u.actor?.avatarUrl} size={44} />
                <View className="absolute -bottom-1 -end-1 h-5 w-5 items-center justify-center rounded-full bg-canvas dark:bg-canvas-dark">
                  <Ionicons name={ICONS[u.kind]} size={14} color={Colors.primary} />
                </View>
              </View>
              <View className="flex-1 gap-0.5">
                <Text className={`text-sm ${u.read ? 'text-ink dark:text-ink-dark' : 'font-bold text-ink dark:text-ink-dark'}`}>
                  {t(`updates.${u.kind}`, { name: u.actor?.displayName ?? t('updates.someone') })}
                </Text>
                {u.body ? (
                  <Text numberOfLines={1} className="text-xs text-muted dark:text-muted-dark">
                    {u.body}
                  </Text>
                ) : u.listingTitle ? (
                  <Text numberOfLines={1} className="text-xs text-muted dark:text-muted-dark">
                    {u.listingTitle}
                  </Text>
                ) : null}
              </View>
              <Text className="text-xs text-muted dark:text-muted-dark">{timeAgo(u.createdAt, language)}</Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
