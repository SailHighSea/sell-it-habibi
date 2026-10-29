import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackdropLayer } from '@/components/ui/backdrop-layer';
import { MessageBubble } from '@/components/chat/message-bubble';
import { MeetupSheet, OfferSheet, SafetySheet } from '@/components/chat/thread-sheets';
import { EmptyState } from '@/components/listings/empty-state';
import { Avatar } from '@/components/ui/avatar';
import { Chip } from '@/components/ui/chip';
import { Sheet } from '@/components/ui/sheet';
import { Colors } from '@/constants/theme';
import { useAsyncData } from '@/hooks/use-async-data';
import type { Message } from '@/lib/chat-types';
import { formatMinor } from '@/lib/money';
import { canMakeOffer } from '@/lib/offers';
import { useAuth } from '@/providers/auth-provider';
import { useInbox } from '@/providers/inbox-provider';
import { usePrefs } from '@/providers/prefs-provider';
import { getBlockedIds, getThread, listMessages, markRead, reportUser, respondOffer, sendImage, sendMeetup, sendOffer, sendText, setBlocked, setMuted, subscribeThread } from '@/services/chat';
import { imageSource } from '@/services/listings';
import { getReviewState } from '@/services/reviews';

function upsert(list: Message[], m: Message): Message[] {
  const i = list.findIndex((x) => x.id === m.id);
  if (i < 0) return [...list, m];
  const next = [...list];
  next[i] = m;
  return next;
}

export default function ThreadScreen() {
  const { id, offer } = useLocalSearchParams<{ id: string; offer?: string }>();
  const { t, rtl, locale } = usePrefs();
  const { user } = useAuth();
  const { refresh: refreshInbox, updates: unreadUpdates } = useInbox();
  const userId = user?.id ?? '';

  const thread = useAsyncData(`thread|${id}`, () => getThread(userId, id));
  const initial = useAsyncData(`messages|${id}`, () => listMessages(userId, id));
  // Re-checked when a new update arrives (a review request shows up as one).
  const review = useAsyncData(`review-state|${id}|${userId}|${thread.data?.listingId ?? ''}|${unreadUpdates}`, async () => (thread.data ? getReviewState(userId, thread.data.listingId) : null));
  const blockedIds = useAsyncData(`blocked|${userId}`, () => getBlockedIds(userId));
  const [live, setLive] = useState<Message[]>([]);

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [offerOpen, setOfferOpen] = useState(offer === '1');
  const [counterTo, setCounterTo] = useState<Message | null>(null);
  const [meetupOpen, setMeetupOpen] = useState(false);
  const [safetyOpen, setSafetyOpen] = useState(false);

  const reloadMessages = initial.reload;
  const messages = useMemo(() => {
    let all = initial.data ?? [];
    for (const m of live) all = upsert(all, m);
    return [...all].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [initial.data, live]);

  // New and changed messages arrive live; merge them into what was loaded.
  useEffect(() => subscribeThread(userId, id, (m) => setLive((cur) => upsert(cur, m))), [userId, id]);

  // Everything up to the newest message from the other person counts as read.
  const lastFromOther = [...messages].reverse().find((m) => m.senderId !== userId)?.id;
  useEffect(() => {
    if (!userId || !thread.data) return;
    markRead(userId, id).then(refreshInbox).catch(() => {});
  }, [userId, id, thread.data, lastFromOther, refreshInbox]);

  const run = useCallback(
    async (fn: () => Promise<void>) => {
      setNotice(null);
      try {
        await fn();
        reloadMessages();
        return true;
      } catch {
        setNotice(t('chat.sendFailed'));
        return false;
      }
    },
    [reloadMessages, t],
  );

  if (thread.loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <BackdropLayer />
        <ActivityIndicator />
      </SafeAreaView>
    );
  }
  const th = thread.data;
  if (!th || thread.failed) {
    return (
      <SafeAreaView className="flex-1">
        <BackdropLayer />
        <EmptyState message={t('chat.loadFailed')} actionLabel={t('common.back')} onAction={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      </SafeAreaView>
    );
  }

  const name = th.other?.displayName ?? t('seller.title');
  const listing = th.listing;
  const otherId = th.iAmSeller ? th.buyerId : th.sellerId;
  const iBlocked = (blockedIds.data ?? []).includes(otherId);
  const quick = th.iAmSeller ? (['yes', 'where'] as const) : (['available', 'bestPrice', 'meetToday'] as const);

  const submitText = async (body: string) => {
    if (!body.trim() || sending) return;
    setSending(true);
    const ok = await run(() => sendText(userId, id, body));
    if (ok) setDraft('');
    setSending(false);
  };

  const pickPhoto = async () => {
    setActionsOpen(false);
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!res.canceled && res.assets[0]) await run(() => sendImage(userId, id, res.assets[0].uri));
  };

  const onRespond = async (m: Message, action: 'accept' | 'decline' | 'counter') => {
    if (action === 'counter') return setCounterTo(m);
    await run(() => respondOffer(userId, m, action));
  };

  return (
    <SafeAreaView className="flex-1">
      <BackdropLayer />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="mx-auto w-full max-w-lg flex-1">
        {/* Header */}
        <View className="flex-row items-center gap-2 px-2 pt-2">
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} className="h-11 w-11 items-center justify-center">
            <Ionicons name={rtl ? 'arrow-forward' : 'arrow-back'} size={22} color={Colors.primary} />
          </Pressable>
          <Pressable accessibilityRole="link" onPress={() => router.push(`/seller/${otherId}`)} className="min-h-11 flex-1 flex-row items-center gap-2">
            <Avatar name={name} uri={th.other?.avatarUrl} size={36} />
            <Text numberOfLines={1} className="flex-1 text-lg font-bold text-ink dark:text-ink-dark">
              {name}
            </Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={t('safety.menu')} onPress={() => setSafetyOpen(true)} className="h-11 w-11 items-center justify-center">
            <Ionicons name="ellipsis-horizontal" size={22} color={Colors.primary} />
          </Pressable>
        </View>

        {/* Listing strip */}
        {listing ? (
          <Pressable accessibilityRole="link" onPress={() => router.push(`/listing/${listing.id}`)} className="mx-3 mt-2 flex-row items-center gap-3 rounded-2xl bg-surface p-2 dark:bg-surface-dark">
            <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-brand-100 dark:bg-hero-dark">
              {listing.imagePath ? <Image source={imageSource(listing.imagePath)} style={{ width: 48, height: 48 }} contentFit="cover" /> : <Ionicons name="image-outline" size={20} color={Colors.placeholder} />}
            </View>
            <View className="flex-1">
              <Text numberOfLines={1} className="text-sm font-semibold text-ink dark:text-ink-dark">
                {listing.title}
              </Text>
              <Text className="text-xs font-bold text-muted dark:text-muted-dark">{listing.type === 'free' ? t('listing.free') : formatMinor(listing.priceMinor, listing.currency, locale)}</Text>
            </View>
            {listing.status !== 'active' ? <Text className="text-xs font-semibold text-danger dark:text-danger-dark">{t(`status.${listing.status}`)}</Text> : null}
          </Pressable>
        ) : null}

        {review.data?.canReview ? (
          <Pressable accessibilityRole="button" onPress={() => router.push(`/review/${th.listingId}`)} className="mx-3 mt-2 min-h-12 flex-row items-center gap-2 rounded-2xl bg-brand-600 px-4 dark:bg-brand-400">
            <Ionicons name="star" size={18} color="#F2B84B" />
            <Text className="flex-1 text-sm font-bold text-white dark:text-canvas-dark">{t('chat.reviewBanner', { name })}</Text>
          </Pressable>
        ) : null}

        {/* Messages (newest at the bottom) */}
        <FlatList
          inverted
          data={[...messages].reverse()}
          keyExtractor={(m) => m.id}
          contentContainerClassName="px-3 py-2"
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => <MessageBubble message={item} mine={item.senderId === userId} listing={listing} onRespond={onRespond} />}
          ListFooterComponent={
            <View className="mb-2 flex-row items-start gap-2 rounded-2xl bg-brand-100 p-3 dark:bg-hero-dark">
              <Ionicons name="shield-checkmark" size={16} color={Colors.primary} />
              <Text className="flex-1 text-xs text-ink dark:text-ink-dark">{t('chat.tip')}</Text>
            </View>
          }
        />

        {notice ? <Text className="px-4 pb-1 text-center text-xs text-danger dark:text-danger-dark">{notice}</Text> : null}

        {/* Composer */}
        {iBlocked ? (
          <Text className="px-4 py-4 text-center text-sm text-muted dark:text-muted-dark">{t('chat.blockedNotice')}</Text>
        ) : (
          <View className="gap-2 px-3 pb-3 pt-1">
            {messages.length === 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
                {quick.map((q) => (
                  <Chip key={q} label={t(`chat.quick.${q}`)} onPress={() => submitText(t(`chat.quick.${q}`))} />
                ))}
              </ScrollView>
            ) : null}
            <View className="flex-row items-end gap-2">
              <Pressable accessibilityRole="button" accessibilityLabel={t('chat.more')} onPress={() => setActionsOpen(true)} className="h-12 w-12 items-center justify-center rounded-full bg-surface dark:bg-surface-dark">
                <Ionicons name="add" size={24} color={Colors.primary} />
              </Pressable>
              <TextInput
                accessibilityLabel={t('chat.placeholder')}
                value={draft}
                onChangeText={setDraft}
                placeholder={t('chat.placeholder')}
                placeholderTextColor={Colors.placeholder}
                multiline
                maxLength={2000}
                onSubmitEditing={() => Platform.OS === 'web' && submitText(draft)}
                className="max-h-28 min-h-12 flex-1 rounded-3xl bg-surface px-4 py-3 text-base text-ink outline-none dark:bg-surface-dark dark:text-ink-dark"
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('chat.send')}
                disabled={!draft.trim() || sending}
                onPress={() => submitText(draft)}
                className={`h-12 w-12 items-center justify-center rounded-full bg-brand-600 dark:bg-brand-400 ${!draft.trim() || sending ? 'opacity-40' : ''}`}>
                <Ionicons name={rtl ? 'arrow-back' : 'arrow-forward'} size={22} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* More actions */}
      <Sheet visible={actionsOpen} title={t('chat.more')} onClose={() => setActionsOpen(false)}>
        <ActionRow icon="image-outline" label={t('chat.sendPhoto')} onPress={pickPhoto} />
        {listing && canMakeOffer(listing) ? <ActionRow icon="pricetag-outline" label={t('chat.makeOffer')} onPress={() => { setActionsOpen(false); setOfferOpen(true); }} /> : null}
        <ActionRow icon="location-outline" label={t('chat.proposeMeetup')} onPress={() => { setActionsOpen(false); setMeetupOpen(true); }} />
      </Sheet>

      {listing ? (
        <>
          <OfferSheet key={`offer-${offerOpen}`} visible={offerOpen} listing={listing} onClose={() => setOfferOpen(false)} onSubmit={async (amount) => { await sendOffer(userId, id, amount); reloadMessages(); }} />
          <OfferSheet
            key={`counter-${counterTo?.id ?? 'none'}`}
            visible={!!counterTo}
            counter
            listing={listing}
            onClose={() => setCounterTo(null)}
            onSubmit={async (amount) => {
              if (counterTo) await respondOffer(userId, counterTo, 'counter', amount);
              reloadMessages();
            }}
          />
        </>
      ) : null}
      <MeetupSheet visible={meetupOpen} onClose={() => setMeetupOpen(false)} onSubmit={async (place, at) => { await sendMeetup(userId, id, place, at); reloadMessages(); }} />
      <SafetySheet
        visible={safetyOpen}
        name={name}
        muted={th.muted}
        blocked={iBlocked}
        onClose={() => setSafetyOpen(false)}
        onMute={async (m) => { await setMuted(userId, id, m); thread.reload(); }}
        onBlock={async (b) => { await setBlocked(userId, otherId, b); blockedIds.reload(); }}
        onReport={async (reason, details) => { await reportUser(userId, { targetId: otherId, listingId: th.listingId, threadId: id, reason, details }); }}
      />
    </SafeAreaView>
  );
}

function ActionRow({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="min-h-14 flex-row items-center gap-3 rounded-2xl bg-surface px-4 dark:bg-surface-dark">
      <Ionicons name={icon} size={22} color={Colors.primary} />
      <Text className="flex-1 text-base font-medium text-ink dark:text-ink-dark">{label}</Text>
    </Pressable>
  );
}
