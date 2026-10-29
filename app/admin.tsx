import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { EmptyState } from '@/components/listings/empty-state';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { useAsyncData } from '@/hooks/use-async-data';
import { timeAgo } from '@/lib/time';
import { isSupabaseConfigured } from '@/lib/supabase';
import { usePrefs } from '@/providers/prefs-provider';
import { imageUrl } from '@/services/listings';
import { listReports, resolveReport, unbanUser, type ModAction, type ModReport } from '@/services/moderation';

/** Staff only (the route is hidden for everyone else, and the database refuses their requests too). */
export default function Moderation() {
  const { t } = usePrefs();
  const [view, setView] = useState<'open' | 'closed'>('open');
  const { data, loading, failed, reload } = useAsyncData(`mod|${view}`, () => listReports(view));

  return (
    <Screen title={t('mod.title')}>
      {isSupabaseConfigured ? null : <Text className="text-xs text-muted dark:text-muted-dark">{t('mod.demo')}</Text>}
      <View className="flex-row rounded-full border border-line bg-surface p-1 dark:border-line-dark dark:bg-surface-dark" accessibilityRole="tablist">
        {(['open', 'closed'] as const).map((v) => (
          <Pressable
            key={v}
            accessibilityRole="tab"
            accessibilityState={{ selected: view === v }}
            onPress={() => setView(v)}
            className={`min-h-11 flex-1 items-center justify-center rounded-full ${view === v ? 'bg-brand-50 dark:bg-hero-dark' : ''}`}>
            <Text className={`text-sm ${view === v ? 'font-bold text-brand-700 dark:text-brand-400' : 'font-semibold text-muted dark:text-muted-dark'}`}>
              {`${t(v === 'open' ? 'mod.open' : 'mod.closed')}${view === v && data ? ` ${data.length}` : ''}`}
            </Text>
          </Pressable>
        ))}
      </View>
      {loading ? (
        <ActivityIndicator className="mt-6" />
      ) : failed ? (
        <EmptyState message={t('home.loadFailed')} actionLabel={t('common.retry')} onAction={reload} />
      ) : (data ?? []).length === 0 ? (
        <EmptyState message={t('mod.empty')} />
      ) : (
        (data ?? []).map((r) => <ReportCard key={r.id} report={r} onChanged={reload} />)
      )}
    </Screen>
  );
}

function ReportCard({ report: r, onChanged }: { report: ModReport; onChanged: () => void }) {
  const { t, language } = usePrefs();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const open = r.status === 'open';

  const act = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onChanged();
    } catch {
      setError(t('my.actionFailed'));
    } finally {
      setBusy(false);
    }
  };
  const resolve = (action: ModAction) => act(() => resolveReport(r.id, action, note));

  return (
    <View className="gap-3 rounded-card bg-surface p-4 dark:bg-surface-dark">
      <View className="flex-row flex-wrap items-center gap-2">
        <View className={`rounded-full px-3 py-1 ${r.source === 'auto' ? 'bg-brand-50 dark:bg-hero-dark' : 'bg-canvas dark:bg-canvas-dark'}`}>
          <Text className="text-xs font-bold text-brand-700 dark:text-brand-400">{r.source === 'auto' ? t('mod.auto') : r.reporter?.name ? t('mod.user', { name: r.reporter.name }) : t('mod.userUnknown')}</Text>
        </View>
        <View className="rounded-full border border-line px-3 py-1 dark:border-line-dark">
          <Text className="text-xs font-semibold text-ink dark:text-ink-dark">{t(`reason.${r.reason}`)}</Text>
        </View>
        <Text className="text-xs text-muted dark:text-muted-dark">{timeAgo(r.createdAt, language)}</Text>
      </View>

      {r.listing ? (
        <Pressable accessibilityRole="link" accessibilityLabel={t('mod.viewListing')} onPress={() => router.push(`/listing/${r.listing!.id}`)} className="flex-row items-center gap-3 rounded-2xl bg-canvas p-2 dark:bg-canvas-dark">
          <View className="h-12 w-12 overflow-hidden rounded-xl bg-brand-100 dark:bg-hero-dark">
            {r.listing.imagePath ? <Image source={{ uri: imageUrl(r.listing.imagePath) }} style={{ width: 48, height: 48 }} contentFit="cover" /> : null}
          </View>
          <View className="flex-1">
            <Text numberOfLines={2} className="text-sm font-semibold text-ink dark:text-ink-dark">{r.listing.title}</Text>
            <Text className="text-xs text-muted dark:text-muted-dark">{t(`status.${r.listing.status}`)}</Text>
          </View>
        </Pressable>
      ) : null}

      {r.target ? (
        <View className="flex-row items-center gap-2">
          <Text className="text-sm text-ink dark:text-ink-dark">{t('mod.target', { name: r.target.name ?? t('updates.someone') })}</Text>
          {r.target.banned ? <Text className="text-xs font-bold text-danger dark:text-danger-dark">{t('mod.banned')}</Text> : null}
        </View>
      ) : null}
      {r.details ? <Text className="text-sm text-ink dark:text-ink-dark">{r.details}</Text> : null}

      {open ? (
        <>
          <TextField label={t('mod.note')} value={note} onChangeText={setNote} maxLength={500} />
          <View className="flex-row flex-wrap gap-2">
            <Button variant="outline" label={t('mod.dismiss')} onPress={() => resolve('dismiss')} disabled={busy} className="min-h-11 px-4" />
            {r.target ? <Button variant="outline" label={t('mod.warn')} onPress={() => resolve('warn')} disabled={busy} className="min-h-11 px-4" /> : null}
            {r.listing && r.listing.status !== 'removed' ? <Button variant="outline" label={t('mod.remove')} onPress={() => resolve('remove_listing')} disabled={busy} className="min-h-11 px-4" /> : null}
            {r.target && !r.target.banned ? <Button label={t('mod.ban')} onPress={() => resolve('ban_user')} disabled={busy} className="min-h-11 bg-danger px-4 dark:bg-danger-dark" /> : null}
          </View>
        </>
      ) : (
        <View className="gap-2">
          <Text className="text-xs font-semibold text-muted dark:text-muted-dark">{r.resolution ? t(`mod.res.${r.resolution}`) : ''}</Text>
          {r.staffNote ? <Text className="text-sm text-ink dark:text-ink-dark">{r.staffNote}</Text> : null}
          {r.target?.banned ? <Button variant="outline" label={t('mod.unban')} onPress={() => act(() => unbanUser(r.target!.id))} disabled={busy} className="min-h-11 self-start px-4" /> : null}
        </View>
      )}
      {error ? <Text className="text-xs text-danger dark:text-danger-dark">{error}</Text> : null}
    </View>
  );
}
