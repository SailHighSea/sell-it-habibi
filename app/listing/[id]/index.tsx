import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, Share, Text, View } from 'react-native';

import { EmptyState } from '@/components/listings/empty-state';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { ReportSheet } from '@/components/ui/report-sheet';
import { Screen } from '@/components/ui/screen';
import { RatingSummary } from '@/components/ui/stars';
import { categoryLabel, fieldsFor } from '@/constants/categories';
import { APP_URL, Colors } from '@/constants/theme';
import { useAsyncData } from '@/hooks/use-async-data';
import { pickName } from '@/lib/names';
import { formatMinor } from '@/lib/money';
import { timeAgo } from '@/lib/time';
import { canMakeOffer } from '@/lib/offers';
import { useAuth } from '@/providers/auth-provider';
import { useEngagement } from '@/providers/engagement-provider';
import { usePrefs } from '@/providers/prefs-provider';
import { reportUser, startThread } from '@/services/chat';
import { getListing, imageSource } from '@/services/listings';

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, language, locale } = usePrefs();
  const { user, status } = useAuth();
  const { isFavorite, toggleFavorite, isFollowing, toggleFollow } = useEngagement();
  const { data: listing, loading, failed, reload } = useAsyncData(`listing|${id}`, () => getListing(id));
  const [page, setPage] = useState(0);
  const [galleryWidth, setGalleryWidth] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  if (loading) {
    return (
      <Screen title="">
        <ActivityIndicator className="mt-10" />
      </Screen>
    );
  }
  if (failed || !listing) {
    return (
      <Screen title="">
        <EmptyState message={failed ? t('listing.loadFailed') : t('listing.notFound')} actionLabel={failed ? t('common.retry') : undefined} onAction={reload} />
      </Screen>
    );
  }

  const mine = user?.id === listing.sellerId;

  const openChat = async (withOffer: boolean) => {
    if (status !== 'signedIn' || !user) return router.push('/sign-in');
    setNotice(null);
    setOpening(true);
    try {
      const threadId = await startThread(user.id, listing.id);
      router.push(withOffer ? `/thread/${threadId}?offer=1` : `/thread/${threadId}`);
    } catch (e) {
      setNotice(e instanceof Error && e.message === 'blocked' ? t('listing.blockedChat') : t('listing.chatFailed'));
    } finally {
      setOpening(false);
    }
  };
  const liked = isFavorite(listing.id);
  const price = listing.type === 'free' ? t('listing.free') : formatMinor(listing.priceMinor, listing.currency, locale);
  const url = `${APP_URL}/listing/${listing.id}`;
  const shareText = t('listing.shareText', { title: listing.title, url });
  const fields = fieldsFor(listing.categorySlug).filter((f) => listing.attributes[f.key] !== undefined);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (galleryWidth) setPage(Math.round(e.nativeEvent.contentOffset.x / galleryWidth));
  };

  const share = () => Share.share({ message: shareText }).catch(() => {});
  const whatsapp = () => Linking.openURL(`https://wa.me/?text=${encodeURIComponent(shareText)}`).catch(() => {});

  return (
    <Screen
      title=""
      footer={
        mine ? (
          <View className="flex-row gap-3">
            <Button className="flex-1" variant="outline" label={t('listing.edit')} onPress={() => router.push(`/listing/${listing.id}/edit`)} />
            <Button className="flex-1" label={t('listing.manage')} onPress={() => router.push('/my-listings')} />
          </View>
        ) : (
          <View className="gap-2">
            {notice ? <Text className="text-center text-xs text-muted dark:text-muted-dark">{notice}</Text> : null}
            <View className="flex-row gap-3">
              <Button className="flex-1" variant={canMakeOffer(listing) ? 'outline' : 'primary'} label={t('listing.chat')} onPress={() => openChat(false)} loading={opening} />
              {canMakeOffer(listing) ? <Button className="flex-1" label={t('listing.makeOffer')} onPress={() => openChat(true)} disabled={opening} /> : null}
            </View>
          </View>
        )
      }>
      {/* Gallery */}
      <View onLayout={(e) => setGalleryWidth(e.nativeEvent.layout.width)} className="overflow-hidden rounded-card bg-brand-100 dark:bg-hero-dark">
        {listing.imagePaths.length && galleryWidth ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScroll} scrollEventThrottle={16}>
            {listing.imagePaths.map((p) => (
              <Image key={p} source={imageSource(p)} style={{ width: galleryWidth, height: galleryWidth * 0.8 }} contentFit="cover" accessibilityLabel={listing.title} />
            ))}
          </ScrollView>
        ) : (
          <View className="aspect-[5/4] items-center justify-center">
            <Ionicons name="image-outline" size={56} color={Colors.placeholder} />
          </View>
        )}
        {listing.imagePaths.length > 1 ? (
          <View className="absolute bottom-3 end-3 rounded-full bg-black/60 px-2.5 py-1">
            <Text className="text-xs font-semibold text-white">{`${page + 1}/${listing.imagePaths.length}`}</Text>
          </View>
        ) : null}
      </View>

      {/* Title block */}
      <View className="gap-2">
        <View className="flex-row items-start justify-between gap-3">
          <Text accessibilityRole="header" className="flex-1 text-3xl font-extrabold text-ink dark:text-ink-dark">
            {price}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(liked ? 'listing.unlike' : 'listing.like')}
            accessibilityState={{ selected: liked }}
            onPress={() => toggleFavorite(listing.id)}
            className="h-11 w-11 items-center justify-center rounded-full bg-surface dark:bg-surface-dark">
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? '#E5484D' : Colors.inactive} />
          </Pressable>
        </View>
        <Text className="text-xl font-semibold text-ink dark:text-ink-dark">{listing.title}</Text>
        <View className="flex-row flex-wrap items-center gap-2">
          <View className="rounded-full bg-brand-50 px-3 py-1 dark:bg-hero-dark">
            <Text className="text-xs font-bold text-brand-700 dark:text-brand-400">{t(`condition.${listing.condition}`)}</Text>
          </View>
          {listing.fixedPrice ? <Tag label={t('listing.fixedPrice')} /> : null}
          {listing.preOrder ? <Tag label={t('listing.preOrder')} /> : null}
          {listing.status !== 'active' ? <Tag label={t(`status.${listing.status}`)} /> : null}
        </View>
        <Text className="text-xs text-muted dark:text-muted-dark">
          {[listing.city, categoryLabel(listing.categorySlug, language), t('listing.posted', { when: timeAgo(listing.bumpedAt, language) }), listing.favoriteCount ? t('listing.favorites', { n: listing.favoriteCount }) : null]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>

      {mine && listing.status === 'removed' ? (
        <View className="rounded-card-sm border border-danger p-3 dark:border-danger-dark">
          <Text className="text-sm font-semibold text-danger dark:text-danger-dark">{t('listing.removedOwner')}</Text>
        </View>
      ) : null}

      {/* Details */}
      {listing.description || fields.length ? (
        <View className="gap-3 rounded-card bg-surface p-4 dark:bg-surface-dark">
          <Text className="text-base font-bold text-ink dark:text-ink-dark">{t('listing.details')}</Text>
          {fields.map((f) => (
            <View key={f.key} className="flex-row justify-between gap-4">
              <Text className="text-sm text-muted dark:text-muted-dark">{pickName(f.label, language)}</Text>
              <Text className="text-sm font-semibold text-ink dark:text-ink-dark">
                {`${listing.attributes[f.key]}${f.unit ? ` ${f.unit}` : ''}`}
              </Text>
            </View>
          ))}
          {listing.description ? <Text className="text-base leading-6 text-ink dark:text-ink-dark">{listing.description}</Text> : null}
        </View>
      ) : null}

      {/* Deal methods */}
      <View className="gap-2">
        <Text className="text-xs font-semibold text-muted dark:text-muted-dark">{t('listing.dealMethods')}</Text>
        <View className="flex-row flex-wrap gap-2">
          {listing.dealMethods.map((d) => (
            <Chip key={d} label={t(`deal.${d}`)} selected />
          ))}
        </View>
      </View>

      {/* Seller */}
      {listing.seller ? (
        <View className="flex-row items-center gap-3 rounded-card bg-surface p-4 dark:bg-surface-dark">
          <Pressable accessibilityRole="link" onPress={() => router.push(`/seller/${listing.sellerId}`)} className="flex-1 flex-row items-center gap-3">
            <Avatar name={listing.seller.displayName} uri={listing.seller.avatarUrl} size={48} />
            <View className="flex-1 gap-0.5">
              <Text className="text-base font-bold text-ink dark:text-ink-dark">{listing.seller.displayName ?? t('seller.title')}</Text>
              <RatingSummary avg={listing.seller.ratingAvg} count={listing.seller.ratingCount} showEmpty={false} />
              <Text className="text-xs text-muted dark:text-muted-dark">
                {[listing.seller.phoneVerified ? t('profile.phoneVerified') : null, listing.seller.city].filter(Boolean).join(' · ')}
              </Text>
            </View>
          </Pressable>
          {mine ? null : (
            <Button
              variant={isFollowing(listing.sellerId) ? 'outline' : 'primary'}
              label={isFollowing(listing.sellerId) ? t('listing.following') : t('listing.follow')}
              onPress={() => toggleFollow(listing.sellerId)}
              className="min-h-11 px-4"
            />
          )}
        </View>
      ) : null}

      {/* Safety tips and reporting (for people looking at someone else's listing) */}
      {mine ? null : (
        <View className="gap-2 rounded-card bg-brand-100 p-4 dark:bg-hero-dark">
          <View className="flex-row items-center gap-2">
            <Ionicons name="shield-checkmark" size={18} color={Colors.primary} />
            <Text className="text-base font-bold text-ink dark:text-ink-dark">{t('tips.title')}</Text>
          </View>
          {(['tips.meet', 'tips.noSend', 'tips.offApp'] as const).map((k) => (
            <Text key={k} className="text-sm text-ink dark:text-ink-dark">{`• ${t(k)}`}</Text>
          ))}
        </View>
      )}

      {/* Share */}
      <View className="flex-row gap-3">
        <Button className="flex-1" variant="outline" label={t('listing.share')} onPress={share} />
        <Button className="flex-1" variant="outline" label={t('listing.whatsapp')} onPress={whatsapp} />
      </View>
      {mine ? null : (
        <Pressable accessibilityRole="button" onPress={() => setReportOpen(true)} className="min-h-11 items-center justify-center">
          <Text className="text-sm font-semibold text-muted underline dark:text-muted-dark">{t('listing.report')}</Text>
        </Pressable>
      )}
      <ReportSheet
        visible={reportOpen}
        title={t('listing.report')}
        onClose={() => setReportOpen(false)}
        onSubmit={async (reason, details) => {
          await reportUser(user?.id ?? null, { targetId: listing.sellerId, listingId: listing.id, reason, details });
        }}
      />
    </Screen>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <View className="rounded-full border border-line px-3 py-1 dark:border-line-dark">
      <Text className="text-xs font-semibold text-muted dark:text-muted-dark">{label}</Text>
    </View>
  );
}
