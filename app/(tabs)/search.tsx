import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/listings/empty-state';
import { ListingGrid } from '@/components/listings/listing-grid';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { TOP_LEVEL_SLUGS, categoryLabel } from '@/constants/categories';
import { Colors } from '@/constants/theme';
import { useAsyncData } from '@/hooks/use-async-data';
import { CONDITIONS, type Condition, type SavedQuery, type SortKey } from '@/lib/listing-types';
import { parseMinor } from '@/lib/money';
import { useAuth } from '@/providers/auth-provider';
import { usePrefs } from '@/providers/prefs-provider';
import { addSavedSearch, getSavedSearches, removeSavedSearch } from '@/services/engagement';
import { searchListings } from '@/services/listings';

const SORTS: SortKey[] = ['newest', 'priceAsc', 'priceDesc', 'popular'];

export default function SearchScreen() {
  const { t, country, currency, language } = usePrefs();
  const { status, user } = useAuth();
  // Saved searches work without an account (kept on the phone) and follow the person once they sign in.
  const userId = status === 'signedIn' ? (user?.id ?? null) : null;

  const [input, setInput] = useState('');
  const [text, setText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState<string | undefined>();
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [minText, setMinText] = useState('');
  const [maxText, setMaxText] = useState('');
  const [freeOnly, setFreeOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('newest');
  const [notice, setNotice] = useState<string | null>(null);

  // Wait for a pause in typing before querying.
  useEffect(() => {
    const id = setTimeout(() => setText(input.trim()), 300);
    return () => clearTimeout(id);
  }, [input]);

  const min = minText.trim() ? parseMinor(minText, currency) : null;
  const max = maxText.trim() ? parseMinor(maxText, currency) : null;
  const query: SavedQuery = {
    text: text || undefined,
    category,
    conditions: conditions.length ? conditions : undefined,
    minPriceMinor: min ?? undefined,
    maxPriceMinor: max ?? undefined,
    freeOnly: freeOnly || undefined,
    sort,
  };
  const active = Boolean(text || category || conditions.length || min !== null || max !== null || freeOnly);

  const results = useAsyncData(`search|${country.code}|${JSON.stringify(query)}`, () => (active ? searchListings({ country: country.code, ...query }) : Promise.resolve([])));
  const saved = useAsyncData(`saved|${userId ?? 'guest'}`, () => getSavedSearches(userId));

  const apply = (q: SavedQuery) => {
    setInput(q.text ?? '');
    setText(q.text ?? '');
    setCategory(q.category);
    setConditions(q.conditions ?? []);
    setMinText(q.minPriceMinor !== undefined ? String(q.minPriceMinor / 100) : '');
    setMaxText(q.maxPriceMinor !== undefined ? String(q.maxPriceMinor / 100) : '');
    setFreeOnly(!!q.freeOnly);
    setSort(q.sort ?? 'newest');
  };

  const clear = () => apply({});

  const save = async () => {
    const name = text || (category ? categoryLabel(category, language) : t('search.placeholder'));
    await addSavedSearch(userId, name, query);
    saved.reload();
    setNotice(t('search.saved'));
  };

  const toggleCondition = (c: Condition) => setConditions((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));

  const header = (
    <View className="gap-3 pt-2">
      <View className="flex-row items-center gap-2">
        <View className="min-h-12 flex-1 flex-row items-center gap-2 rounded-full bg-surface px-4 dark:bg-surface-dark">
          <Ionicons name="search" size={18} color={Colors.inactive} />
          <TextInput
            accessibilityLabel={t('search.placeholder')}
            value={input}
            onChangeText={setInput}
            placeholder={t('search.placeholder')}
            placeholderTextColor={Colors.placeholder}
            returnKeyType="search"
            className="flex-1 py-2 text-base text-ink outline-none dark:text-ink-dark"
          />
          {input ? (
            <Pressable accessibilityRole="button" accessibilityLabel={t('search.clear')} onPress={() => setInput('')} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={Colors.placeholder} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('search.filters')}
          accessibilityState={{ expanded: showFilters }}
          onPress={() => setShowFilters((v) => !v)}
          className={`h-12 w-12 items-center justify-center rounded-full ${showFilters ? 'bg-brand-50 dark:bg-hero-dark' : 'bg-surface dark:bg-surface-dark'}`}>
          <Ionicons name="options-outline" size={22} color={Colors.primary} />
        </Pressable>
      </View>

      {showFilters ? (
        <View className="gap-4 rounded-card bg-surface p-4 dark:bg-surface-dark">
          <Group label={t('form.category')}>
            {TOP_LEVEL_SLUGS.map((slug) => (
              <Chip key={slug} label={categoryLabel(slug, language)} selected={category === slug} onPress={() => setCategory(category === slug ? undefined : slug)} />
            ))}
          </Group>
          <Group label={t('form.condition')}>
            {CONDITIONS.map((c) => (
              <Chip key={c} label={t(`condition.${c}`)} selected={conditions.includes(c)} onPress={() => toggleCondition(c)} />
            ))}
          </Group>
          <Group label={t('search.price', { currency })}>
            <View className="flex-row gap-3" style={{ direction: 'ltr' }}>
              {[
                [t('search.min'), minText, setMinText],
                [t('search.max'), maxText, setMaxText],
              ].map(([label, value, set]) => (
                <TextInput
                  key={label as string}
                  accessibilityLabel={label as string}
                  value={value as string}
                  onChangeText={set as (v: string) => void}
                  placeholder={label as string}
                  placeholderTextColor={Colors.placeholder}
                  keyboardType="decimal-pad"
                  className="min-h-11 w-28 rounded-2xl border border-line px-3 text-base text-ink dark:border-line-dark dark:text-ink-dark"
                />
              ))}
            </View>
          </Group>
          <Group label={t('search.sort')}>
            {SORTS.map((s) => (
              <Chip key={s} label={t(`sort.${s}`)} selected={sort === s} onPress={() => setSort(s)} />
            ))}
          </Group>
          <Group label="">
            <Chip label={t('search.freeOnly')} selected={freeOnly} onPress={() => setFreeOnly((v) => !v)} />
          </Group>
          <Button variant="ghost" label={t('search.clear')} onPress={clear} />
        </View>
      ) : null}

      {active ? (
        <View className="flex-row items-center justify-between">
          <Pressable accessibilityRole="button" onPress={save} className="min-h-11 justify-center">
            <Text className="text-sm font-bold text-brand-600 dark:text-brand-400">{t('search.save')}</Text>
          </Pressable>
          {notice ? <Text className="text-xs text-muted dark:text-muted-dark">{notice}</Text> : null}
        </View>
      ) : null}
    </View>
  );

  const savedList = saved.data ?? [];
  const empty = !active ? (
    <View className="mt-6 gap-3">
      <Text className="text-center text-muted dark:text-muted-dark">{t('search.hint')}</Text>
      {savedList.length ? (
        <View className="gap-2">
          <Text className="text-base font-bold text-ink dark:text-ink-dark">{t('search.savedTitle')}</Text>
          {savedList.map((s) => (
            <View key={s.id} className="min-h-12 flex-row items-center rounded-2xl bg-surface px-4 dark:bg-surface-dark">
              <Pressable accessibilityRole="button" onPress={() => apply(s.query)} className="min-h-12 flex-1 justify-center">
                <Text className="text-base text-ink dark:text-ink-dark">{s.name}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('search.removeSaved')}
                onPress={async () => {
                  await removeSavedSearch(userId, s.id);
                  saved.reload();
                }}
                className="h-11 w-11 items-center justify-center">
                <Ionicons name="close" size={18} color={Colors.inactive} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  ) : results.loading ? (
    <ActivityIndicator className="mt-10" />
  ) : results.failed ? (
    <EmptyState message={t('search.failed')} actionLabel={t('common.retry')} onAction={results.reload} />
  ) : (
    <EmptyState message={t('search.noResults')} />
  );

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas dark:bg-canvas-dark">
      <ListingGrid data={active ? (results.data ?? []) : []} header={header} empty={empty} />
    </SafeAreaView>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      {label ? <Text className="text-xs font-semibold text-muted dark:text-muted-dark">{label}</Text> : null}
      <View className="flex-row flex-wrap gap-2">{children}</View>
    </View>
  );
}
