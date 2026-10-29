import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/listings/empty-state';
import { Avatar } from '@/components/ui/avatar';
import { useAsyncData } from '@/hooks/use-async-data';
import type { Thread } from '@/lib/chat-types';
import { timeAgo } from '@/lib/time';
import { useAuth } from '@/providers/auth-provider';
import { useInbox } from '@/providers/inbox-provider';
import { usePrefs } from '@/providers/prefs-provider';
import { listThreads } from '@/services/chat';

export default function ChatsScreen() {
  const { t, language } = usePrefs();
  const { status, user } = useAuth();
  const { refresh } = useInbox();
  const signedIn = status === 'signedIn';
  const { data, loading, failed, reload } = useAsyncData(`threads|${user?.id ?? ''}`, () => (signedIn && user ? listThreads(user.id) : Promise.resolve([] as Thread[])));

  const preview = (th: Thread) =>
    th.lastKind === 'text' ? th.lastPreview : th.lastKind === 'image' ? t('chat.photo') : th.lastKind === 'offer' ? t('chat.offer') : th.lastKind === 'meetup' ? t('chat.meetup') : th.lastKind === 'system' ? t('chat.offer') : '';

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas dark:bg-canvas-dark">
      <Text accessibilityRole="header" className="px-5 pb-2 pt-3 text-3xl font-extrabold text-ink dark:text-ink-dark">
        {t('chats.title')}
      </Text>
      {!signedIn ? (
        <EmptyState message={t('chats.signIn')} actionLabel={t('auth.signIn')} onAction={() => router.push('/sign-in')} />
      ) : loading ? (
        <ActivityIndicator className="mt-10" />
      ) : failed ? (
        <EmptyState message={t('home.loadFailed')} actionLabel={t('common.retry')} onAction={reload} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(th) => th.id}
          contentContainerClassName="mx-auto w-full max-w-lg gap-1 px-3 pb-6"
          ListEmptyComponent={<EmptyState message={t('chats.empty')} />}
          onRefresh={() => {
            reload();
            refresh();
          }}
          refreshing={false}
          renderItem={({ item: th }) => (
            <Pressable accessibilityRole="link" onPress={() => router.push(`/thread/${th.id}`)} className="min-h-16 flex-row items-center gap-3 rounded-2xl px-2 py-2">
              <Avatar name={th.other?.displayName} uri={th.other?.avatarUrl} size={48} />
              <View className="flex-1 gap-0.5">
                <View className="flex-row items-center justify-between gap-2">
                  <Text numberOfLines={1} className="flex-1 text-base font-bold text-ink dark:text-ink-dark">
                    {th.other?.displayName ?? t('seller.title')}
                  </Text>
                  <Text className="text-xs text-muted dark:text-muted-dark">{timeAgo(th.lastMessageAt, language)}</Text>
                </View>
                <Text numberOfLines={1} className="text-xs text-muted dark:text-muted-dark">
                  {th.listing?.title}
                </Text>
                <Text numberOfLines={1} className={`text-sm ${th.unread ? 'font-bold text-ink dark:text-ink-dark' : 'text-muted dark:text-muted-dark'}`}>
                  {preview(th)}
                </Text>
              </View>
              {th.unread ? (
                <View className="h-6 min-w-6 items-center justify-center rounded-full bg-brand-600 px-1.5 dark:bg-brand-400">
                  <Text className="text-xs font-bold text-white dark:text-canvas-dark">{th.unread}</Text>
                </View>
              ) : null}
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
