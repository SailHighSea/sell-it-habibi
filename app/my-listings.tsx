import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { EmptyState } from '@/components/listings/empty-state';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Screen } from '@/components/ui/screen';
import { Colors } from '@/constants/theme';
import { useAsyncData } from '@/hooks/use-async-data';
import { normalizeSearch } from '@/lib/arabic';
import type { Listing, ListingStatus, Seller } from '@/lib/listing-types';
import { formatMinor } from '@/lib/money';
import { useAuth } from '@/providers/auth-provider';
import { usePrefs } from '@/providers/prefs-provider';
import { bumpListing, canBump, deleteListing, imageUrl, searchListings, setListingStatus } from '@/services/listings';
import { listBuyerCandidates, markSold } from '@/services/reviews';

const TABS: ListingStatus[] = ['active', 'inactive', 'sold'];

export default function MyListings() {
  const { t, locale } = usePrefs();
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const [tab, setTab] = useState<ListingStatus>('active');
  const [query, setQuery] = useState('');
  const [confirming, setConfirming] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [soldFor, setSoldFor] = useState<Listing | null>(null);
  const [buyers, setBuyers] = useState<Seller[] | null>(null);
  const [soldError, setSoldError] = useState<string | null>(null);

  // Who can be named as the buyer: people who messaged about this item.
  useEffect(() => {
    if (!soldFor) return;
    let cancelled = false;
    listBuyerCandidates(soldFor.id)
      .then((b) => !cancelled && setBuyers(b))
      .catch(() => !cancelled && setBuyers([]));
    return () => {
      cancelled = true;
    };
  }, [soldFor]);

  const closeSold = () => {
    setSoldFor(null);
    setBuyers(null);
    setSoldError(null);
  };
  const finishSold = async (buyerId: string | null) => {
    if (!soldFor) return;
    setSoldError(null);
    try {
      await markSold(soldFor.id, buyerId);
      closeSold();
      reload();
    } catch {
      setSoldError(t('sold.failed'));
    }
  };

  const { data, loading, failed, reload } = useAsyncData(`mine|${userId}`, () => searchListings({ sellerId: userId, status: 'all', limit: 200 }));
  const all = data ?? [];
  // Listings a moderator removed are shown under Inactive, marked as removed.
  const inTab = (l: Listing, s: ListingStatus) => (s === 'inactive' ? l.status === 'inactive' || l.status === 'removed' : l.status === s);
  const counts = Object.fromEntries(TABS.map((s) => [s, all.filter((l) => inTab(l, s)).length])) as Record<ListingStatus, number>;
  const q = normalizeSearch(query.trim());
  const rows = all.filter((l) => inTab(l, tab) && (!q || normalizeSearch(l.title).includes(q)));

  const run = async (action: () => Promise<void>, ok?: string) => {
    setMessage(null);
    try {
      await action();
      if (ok) setMessage(ok);
      reload();
    } catch (e) {
      setMessage(e instanceof Error && e.message === 'bump_too_soon' ? t('my.bumpWait') : t('my.actionFailed'));
    }
  };

  return (
    <Screen title={t('my.title')}>
      <View className="flex-row rounded-full border border-line bg-surface p-1 dark:border-line-dark dark:bg-surface-dark" accessibilityRole="tablist">
        {TABS.map((s) => (
          <Pressable
            key={s}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === s }}
            onPress={() => setTab(s)}
            className={`min-h-11 flex-1 items-center justify-center rounded-full ${tab === s ? 'bg-brand-50 dark:bg-hero-dark' : ''}`}>
            <Text className={`text-sm ${tab === s ? 'font-bold text-brand-700 dark:text-brand-400' : 'font-semibold text-muted dark:text-muted-dark'}`}>
              {`${t(`status.${s}`)} ${counts[s]}`}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="min-h-12 flex-row items-center gap-2 rounded-full bg-surface px-4 dark:bg-surface-dark">
        <Ionicons name="search" size={18} color={Colors.inactive} />
        <TextInput
          accessibilityLabel={t('my.search')}
          value={query}
          onChangeText={setQuery}
          placeholder={t('my.search')}
          placeholderTextColor={Colors.placeholder}
          className="flex-1 py-2 text-base text-ink outline-none dark:text-ink-dark"
        />
      </View>

      {message ? <Text className="text-center text-xs text-muted dark:text-muted-dark">{message}</Text> : null}

      {loading ? (
        <ActivityIndicator className="mt-6" />
      ) : failed ? (
        <EmptyState message={t('home.loadFailed')} actionLabel={t('common.retry')} onAction={reload} />
      ) : rows.length === 0 ? (
        <EmptyState message={t('my.empty')} />
      ) : (
        rows.map((l) => (
          <Row
            key={l.id}
            listing={l}
            price={l.type === 'free' ? t('listing.free') : formatMinor(l.priceMinor, l.currency, locale)}
            confirming={confirming === l.id}
            onEdit={() => router.push(`/listing/${l.id}/edit`)}
            onToggle={() => run(() => setListingStatus(l.id, l.status === 'active' ? 'inactive' : 'active'))}
            onSold={() => setSoldFor(l)}
            onBump={() => run(() => bumpListing(l.id), t('my.bumped'))}
            onDelete={() => {
              if (confirming === l.id) {
                setConfirming(null);
                run(() => deleteListing(l.id));
              } else setConfirming(l.id);
            }}
          />
        ))
      )}
      <Sheet visible={!!soldFor} title={t('sold.title')} onClose={closeSold}>
        <Text className="text-sm text-muted dark:text-muted-dark">{t('sold.help')}</Text>
        {buyers === null ? <ActivityIndicator /> : null}
        {buyers?.length === 0 ? <Text className="text-sm text-muted dark:text-muted-dark">{t('sold.none')}</Text> : null}
        {(buyers ?? []).map((b) => (
          <Pressable key={b.id} accessibilityRole="button" onPress={() => finishSold(b.id)} className="min-h-14 flex-row items-center gap-3 rounded-2xl bg-surface px-3 dark:bg-surface-dark">
            <Avatar name={b.displayName} uri={b.avatarUrl} size={36} />
            <Text className="flex-1 text-base font-semibold text-ink dark:text-ink-dark">{b.displayName ?? t('updates.someone')}</Text>
          </Pressable>
        ))}
        <Button variant="outline" label={t('sold.outside')} onPress={() => finishSold(null)} />
        <Text className="-mt-2 text-center text-xs text-muted dark:text-muted-dark">{t('sold.outsideHelp')}</Text>
        {soldError ? <Text className="text-center text-xs text-danger dark:text-danger-dark">{soldError}</Text> : null}
      </Sheet>
    </Screen>
  );
}

type RowProps = {
  listing: Listing;
  price: string;
  confirming: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onSold: () => void;
  onBump: () => void;
  onDelete: () => void;
};

function Row({ listing: l, price, confirming, onEdit, onToggle, onSold, onBump, onDelete }: RowProps) {
  const { t } = usePrefs();
  const cover = l.imagePaths[0];
  return (
    <View className="gap-3 rounded-card bg-surface p-3 dark:bg-surface-dark">
      <Pressable accessibilityRole="link" onPress={() => router.push(`/listing/${l.id}`)} className="flex-row items-center gap-3">
        <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-brand-100 dark:bg-hero-dark">
          {cover ? <Image source={{ uri: imageUrl(cover) }} style={{ width: 64, height: 64 }} contentFit="cover" /> : <Ionicons name="image-outline" size={22} color={Colors.placeholder} />}
        </View>
        <View className="flex-1 gap-0.5">
          <Text numberOfLines={2} className="text-base font-semibold text-ink dark:text-ink-dark">
            {l.title}
          </Text>
          <Text className="text-sm font-bold text-ink dark:text-ink-dark">{price}</Text>
          <View className="flex-row items-center gap-1">
            <Ionicons name="heart" size={12} color={Colors.placeholder} />
            <Text className="text-xs text-muted dark:text-muted-dark">{l.favoriteCount}</Text>
          </View>
        </View>
      </Pressable>
      {l.status === 'removed' ? <Text className="text-xs font-semibold text-danger dark:text-danger-dark">{t('my.removed')}</Text> : null}
      <View className="flex-row flex-wrap gap-2">
        {l.status === 'removed' ? null : <Small label={t('listing.edit')} onPress={onEdit} />}
        {l.status === 'removed' ? null : l.status !== 'sold' ? <Small label={l.status === 'active' ? t('my.deactivate') : t('my.activate')} onPress={onToggle} /> : <Small label={t('my.activate')} onPress={onToggle} />}
        {l.status === 'active' ? <Small label={t('my.markSold')} onPress={onSold} /> : null}
        {l.status === 'active' ? <Small label={t('my.bump')} onPress={onBump} dim={!canBump(l)} /> : null}
        <Small label={confirming ? t('my.confirmDelete') : t('my.delete')} onPress={onDelete} danger />
      </View>
    </View>
  );
}

/** `dim` looks unavailable but stays tappable so the screen can say why. */
function Small({ label, onPress, dim, danger }: { label: string; onPress: () => void; dim?: boolean; danger?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={`min-h-11 justify-center rounded-full border px-4 ${danger ? 'border-danger dark:border-danger-dark' : 'border-line dark:border-line-dark'} ${dim ? 'opacity-40' : ''}`}>
      <Text className={`text-xs font-bold ${danger ? 'text-danger dark:text-danger-dark' : 'text-brand-700 dark:text-brand-400'}`}>{label}</Text>
    </Pressable>
  );
}

