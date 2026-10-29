import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { TOP_LEVEL_SLUGS, categoryLabel, childrenOf, fieldsFor, topLevelOf } from '@/constants/categories';
import { Colors } from '@/constants/theme';
import { uriToBase64 } from '@/lib/image';
import { checkProhibited, ruleLabel } from '@/lib/prohibited';
import { CONDITIONS, DEAL_METHODS, type Condition, type DealMethod, type Listing, type ListingInput, type ListingType } from '@/lib/listing-types';
import { formatMinor, parseMinor } from '@/lib/money';
import type { PhotoSuggestion } from '@/lib/suggestion';
import { useAuth } from '@/providers/auth-provider';
import { usePrefs } from '@/providers/prefs-provider';
import { suggestFromPhoto } from '@/services/ai';
import { createListing, imageSource, updateListing } from '@/services/listings';

const MAX_PHOTOS = 10;
const DRAFT_KEY = 'sih.draft.listing.v1';

type Template = 'casual' | 'bullets' | 'short' | 'own';
type Errors = Partial<Record<'photos' | 'title' | 'category' | 'price' | 'deal' | 'prohibited', string>>;
type Draft = { title: string; description: string; priceText: string; categorySlug: string; condition: Condition; type: ListingType; dealMethods: DealMethod[] };

export function ListingForm({ listing }: { listing?: Listing }) {
  const editing = !!listing;
  const { t, language, country, currency, locale, rtl } = usePrefs();
  const { user, profile } = useAuth();

  const [photos, setPhotos] = useState<string[]>(listing?.imagePaths ?? []);
  const [title, setTitle] = useState(listing?.title ?? '');
  const [categorySlug, setCategorySlug] = useState(listing?.categorySlug ?? '');
  const [condition, setCondition] = useState<Condition>(listing?.condition ?? 'used');
  const [description, setDescription] = useState(listing?.description ?? '');
  const [template, setTemplate] = useState<Template | null>(null);
  const [type, setType] = useState<ListingType>(listing?.type ?? 'sale');
  const [priceText, setPriceText] = useState(listing && listing.type === 'sale' ? String(listing.priceMinor / 100) : '');
  const [fixedPrice, setFixedPrice] = useState(listing?.fixedPrice ?? false);
  const [preOrder, setPreOrder] = useState(listing?.preOrder ?? false);
  const [dealMethods, setDealMethods] = useState<DealMethod[]>(listing?.dealMethods ?? ['meetup']);
  const [city, setCity] = useState(listing?.city ?? profile?.city ?? '');
  const [attrs, setAttrs] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(listing?.attributes ?? {}).map(([k, v]) => [k, String(v)])),
  );

  const [ai, setAi] = useState<'idle' | 'reading' | 'done' | 'failed'>('idle');
  const [suggestion, setSuggestion] = useState<PhotoSuggestion | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const aiRun = useRef(0);

  const top = categorySlug ? topLevelOf(categorySlug) : '';
  const subs = top ? childrenOf(top) : [];

  // ----- drafts (new listings only; photo URIs don't survive a restart, so they aren't stored) -----
  useEffect(() => {
    if (editing) return;
    AsyncStorage.getItem(DRAFT_KEY)
      .then((raw) => {
        if (!raw) return;
        const d = JSON.parse(raw) as Draft;
        if (!d.title && !d.description && !d.priceText) return;
        setTitle(d.title);
        setDescription(d.description);
        setPriceText(d.priceText);
        setCategorySlug(d.categorySlug);
        setCondition(d.condition);
        setType(d.type);
        setDealMethods(d.dealMethods);
        setDraftRestored(true);
      })
      .catch(() => {});
  }, [editing]);

  useEffect(() => {
    if (editing) return;
    const draft: Draft = { title, description, priceText, categorySlug, condition, type, dealMethods };
    const id = setTimeout(() => AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft)).catch(() => {}), 500);
    return () => clearTimeout(id);
  }, [editing, title, description, priceText, categorySlug, condition, type, dealMethods]);

  const discardDraft = () => {
    AsyncStorage.removeItem(DRAFT_KEY).catch(() => {});
    setTitle('');
    setDescription('');
    setPriceText('');
    setCategorySlug('');
    setCondition('used');
    setType('sale');
    setDealMethods(['meetup']);
    setDraftRestored(false);
  };

  // ----- photos and AI autofill -----
  const addPhotos = async (source: 'library' | 'camera') => {
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) return;
    const res =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: room, quality: 0.6 });
    if (res.canceled) return;
    const uris = res.assets.map((a) => a.uri).slice(0, room);
    const first = photos.length === 0;
    setPhotos((cur) => [...cur, ...uris].slice(0, MAX_PHOTOS));
    if (first && !editing && uris[0]) autofill(uris[0]);
  };

  const autofill = async (uri: string) => {
    const run = ++aiRun.current;
    setAi('reading');
    try {
      const { base64, mediaType } = await uriToBase64(uri);
      const s = await suggestFromPhoto({ base64, mediaType, language, currency });
      if (run !== aiRun.current) return;
      setSuggestion(s);
      // Only fill what the person hasn't typed yet.
      setTitle((cur) => cur || s.title);
      setCategorySlug((cur) => cur || s.categorySlug || '');
      setCondition(s.condition);
      setDescription((cur) => {
        if (cur) return cur;
        setTemplate('bullets');
        return s.bulletPoints.map((b) => `• ${b}`).join('\n');
      });
      setAi('done');
    } catch {
      if (run === aiRun.current) setAi('failed');
    }
  };

  const movePhoto = (index: number, delta: -1 | 1) =>
    setPhotos((cur) => {
      const next = [...cur];
      const j = index + delta;
      if (j < 0 || j >= next.length) return cur;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });

  const pickTemplate = (tpl: Template) => {
    setTemplate(tpl);
    if (!suggestion || tpl === 'own') return;
    setDescription(
      tpl === 'bullets' ? suggestion.bulletPoints.map((b) => `• ${b}`).join('\n') : tpl === 'short' ? suggestion.descriptionShort : suggestion.descriptionCasual,
    );
  };

  const toggleDeal = (d: DealMethod) => setDealMethods((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));

  // ----- submit -----
  const priceMinor = type === 'free' ? 0 : parseMinor(priceText, currency);
  // Starter prohibited-items list for the chosen country: "block" stops the listing, "warn" only shows a notice.
  const prohibited = checkProhibited(`${title} ${description}`, country.code);
  const problems: Errors = {};
  if (photos.length === 0) problems.photos = t('err.photos');
  if (title.trim().length < 3 || title.trim().length > 120) problems.title = t('err.title');
  if (!categorySlug || (subs.length > 0 && categorySlug === top)) problems.category = t('err.category');
  if (type === 'sale' && (priceMinor === null || priceMinor <= 0)) problems.price = t('err.price');
  if (dealMethods.length === 0) problems.deal = t('err.deal');
  if (prohibited.blocked.length > 0) problems.prohibited = t('err.prohibited');
  // Errors appear after the first attempt to list, then update as the person fixes each field.
  const errors: Errors = showErrors ? problems : {};

  const submit = async () => {
    setShowErrors(true);
    setSubmitError(null);
    if (Object.keys(problems).length || !user) return;

    const attributes: ListingInput['attributes'] = {};
    for (const f of fieldsFor(categorySlug)) {
      const raw = (attrs[f.key] ?? '').trim();
      if (!raw) continue;
      const n = Number(raw);
      attributes[f.key] = f.kind === 'number' && Number.isFinite(n) ? n : raw;
    }
    const input: ListingInput = {
      title, description: description || null, priceMinor: priceMinor ?? 0, currency, condition, type, categorySlug,
      country: country.code, city: city || null, attributes, fixedPrice: type === 'sale' && fixedPrice, preOrder, dealMethods,
    };

    setBusy(true);
    try {
      const saved = editing ? await updateListing(user.id, listing.id, input, photos) : await createListing(user.id, input, photos);
      if (!editing) AsyncStorage.removeItem(DRAFT_KEY).catch(() => {});
      router.replace(`/listing/${saved.id}`);
    } catch {
      setSubmitError(t('form.saveFailed'));
      setBusy(false);
    }
  };

  const hint =
    suggestion?.priceMin != null && suggestion.priceMax != null
      ? t('form.priceHint', { range: `${formatMinor(suggestion.priceMin * 100, currency, locale)} - ${formatMinor(suggestion.priceMax * 100, currency, locale)}` })
      : null;

  return (
    <Screen
      title={editing ? t('form.editTitle') : t('form.newTitle')}
      footer={
        <View className="gap-2">
          {submitError ? <Text className="text-center text-xs text-danger dark:text-danger-dark">{submitError}</Text> : null}
          <Button label={editing ? t('form.saveChanges') : t('form.submit')} onPress={submit} loading={busy} />
        </View>
      }>
      {draftRestored ? (
        <View className="flex-row items-center gap-2 rounded-2xl bg-brand-100 p-3 dark:bg-hero-dark">
          <Text className="flex-1 text-xs text-ink dark:text-ink-dark">{t('form.draftRestored')}</Text>
          <Pressable accessibilityRole="button" onPress={discardDraft} className="min-h-11 justify-center">
            <Text className="text-xs font-bold text-brand-600 dark:text-brand-400">{t('form.discardDraft')}</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Photos */}
      <View className="gap-2">
        <Text className="text-base font-bold text-ink dark:text-ink-dark">{t('form.photos')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 py-1">
          {photos.map((p, i) => (
            <View key={`${p}-${i}`} className="w-28 gap-1">
              <View className="h-28 w-28 overflow-hidden rounded-2xl bg-brand-100 dark:bg-hero-dark">
                <Image source={imageSource(p)} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                {i === 0 ? (
                  <View className="absolute start-1 top-1 rounded-full bg-black/60 px-2 py-0.5">
                    <Text className="text-[10px] font-bold text-white">{t('form.cover')}</Text>
                  </View>
                ) : null}
              </View>
              <View className="flex-row items-center justify-between">
                <IconButton name={rtl ? 'chevron-forward' : 'chevron-back'} label={t('form.earlier')} disabled={i === 0} onPress={() => movePhoto(i, -1)} />
                <IconButton name="trash-outline" label={t('form.remove')} onPress={() => setPhotos((cur) => cur.filter((_, j) => j !== i))} />
                <IconButton name={rtl ? 'chevron-back' : 'chevron-forward'} label={t('form.later')} disabled={i === photos.length - 1} onPress={() => movePhoto(i, 1)} />
              </View>
            </View>
          ))}
          {photos.length < MAX_PHOTOS ? (
            <View className="gap-2">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('form.addPhotos')}
                onPress={() => addPhotos('library')}
                className="h-28 w-28 items-center justify-center gap-1 rounded-2xl border-[1.5px] border-dashed border-muted dark:border-muted-dark">
                <Ionicons name="images-outline" size={26} color={Colors.inactive} />
                <Text className="text-xs font-semibold text-muted dark:text-muted-dark">{t('form.addPhotos')}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => addPhotos('camera')} className="min-h-11 items-center justify-center">
                <Text className="text-xs font-bold text-brand-600 dark:text-brand-400">{t('form.takePhoto')}</Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
        <Text className="text-xs text-muted dark:text-muted-dark">{t('form.photosHelp')}</Text>
        {errors.photos ? <Text className="text-xs text-danger dark:text-danger-dark">{errors.photos}</Text> : null}
      </View>

      {ai === 'reading' ? (
        <View className="flex-row items-center gap-3 rounded-2xl bg-brand-100 p-3 dark:bg-hero-dark">
          <ActivityIndicator />
          <Text className="flex-1 text-sm text-ink dark:text-ink-dark">{t('form.reading')}</Text>
        </View>
      ) : ai === 'done' ? (
        <View className="flex-row items-start gap-2 rounded-2xl bg-brand-100 p-3 dark:bg-hero-dark">
          <Ionicons name="sparkles" size={18} color={Colors.primary} />
          <Text className="flex-1 text-sm text-ink dark:text-ink-dark">{t('form.filled')}</Text>
        </View>
      ) : ai === 'failed' ? (
        <Text className="text-xs text-muted dark:text-muted-dark">{t('form.aiFailed')}</Text>
      ) : null}

      {prohibited.blocked.length > 0 ? (
        <View className="gap-1 rounded-2xl border border-danger p-3 dark:border-danger-dark">
          {prohibited.blocked.map((r) => (
            <Text key={r.id} className="text-sm font-semibold text-danger dark:text-danger-dark">
              {t('prohibited.blocked', { item: ruleLabel(r, language) })}
            </Text>
          ))}
          {errors.prohibited ? <Text className="text-xs text-danger dark:text-danger-dark">{errors.prohibited}</Text> : null}
        </View>
      ) : prohibited.warned.length > 0 ? (
        <View className="rounded-2xl bg-brand-gold/20 p-3">
          <Text className="text-sm text-ink dark:text-ink-dark">{t('prohibited.warn', { item: prohibited.warned.map((r) => ruleLabel(r, language)).join(', ') })}</Text>
        </View>
      ) : null}

      <TextField label={t('form.title')} value={title} onChangeText={setTitle} placeholder={t('form.titlePlaceholder')} maxLength={120} error={errors.title} />

      {/* Category tree */}
      <View className="gap-2">
        <Text className="text-xs font-semibold text-muted dark:text-muted-dark">{t('form.category')}</Text>
        <View className="flex-row flex-wrap gap-2">
          {TOP_LEVEL_SLUGS.map((slug) => (
            <Chip key={slug} label={categoryLabel(slug, language)} selected={top === slug} onPress={() => top !== slug && setCategorySlug(slug)} />
          ))}
        </View>
        {subs.length ? (
          <>
            <Text className="mt-1 text-xs font-semibold text-muted dark:text-muted-dark">{t('form.subcategory')}</Text>
            <View className="flex-row flex-wrap gap-2">
              {subs.map((c) => (
                <Chip key={c.slug} label={categoryLabel(c.slug, language)} selected={categorySlug === c.slug} onPress={() => setCategorySlug(c.slug)} />
              ))}
            </View>
          </>
        ) : null}
        {errors.category ? <Text className="text-xs text-danger dark:text-danger-dark">{errors.category}</Text> : null}
      </View>

      <View className="gap-2">
        <Text className="text-xs font-semibold text-muted dark:text-muted-dark">{t('form.condition')}</Text>
        <View className="flex-row flex-wrap gap-2">
          {CONDITIONS.map((c) => (
            <Chip key={c} label={t(`condition.${c}`)} selected={condition === c} onPress={() => setCondition(c)} />
          ))}
        </View>
      </View>

      {/* Description */}
      <View className="gap-2">
        <Text className="text-xs font-semibold text-muted dark:text-muted-dark">{t('form.description')}</Text>
        {suggestion ? (
          <View className="flex-row flex-wrap gap-2">
            {(['casual', 'bullets', 'short', 'own'] as Template[]).map((tpl) => (
              <Chip
                key={tpl}
                label={t(`form.tpl${tpl === 'casual' ? 'Casual' : tpl === 'bullets' ? 'Bullets' : tpl === 'short' ? 'Short' : 'Own'}`)}
                selected={template === tpl}
                onPress={() => pickTemplate(tpl)}
              />
            ))}
          </View>
        ) : null}
        <TextField
          label={t('form.description')}
          value={description}
          onChangeText={(v) => {
            setDescription(v);
            if (template && template !== 'own') setTemplate('own');
          }}
          placeholder={t('form.descriptionPlaceholder')}
          maxLength={4000}
          multiline
          className="min-h-28 pt-3"
          style={{ textAlignVertical: 'top' }}
        />
      </View>

      {/* Price */}
      <View className="gap-3">
        <View className="flex-row gap-2">
          <Chip label={t('form.forSale')} selected={type === 'sale'} onPress={() => setType('sale')} />
          <Chip label={t('form.forFree')} selected={type === 'free'} onPress={() => setType('free')} />
        </View>
        {type === 'sale' ? (
          <>
            <TextField
              label={t('form.price', { currency })}
              value={priceText}
              onChangeText={setPriceText}
              keyboardType="decimal-pad"
              error={errors.price}
              help={hint ?? undefined}
              style={{ textAlign: 'left', writingDirection: 'ltr' }}
            />
            <ToggleRow label={t('listing.fixedPrice')} help={t('form.fixedPriceHelp')} value={fixedPrice} onChange={setFixedPrice} />
          </>
        ) : null}
        <ToggleRow label={t('listing.preOrder')} help={t('form.preOrderHelp')} value={preOrder} onChange={setPreOrder} />
      </View>

      {/* Deal method */}
      <View className="gap-2">
        <Text className="text-xs font-semibold text-muted dark:text-muted-dark">{t('listing.dealMethods')}</Text>
        <View className="flex-row flex-wrap gap-2">
          {DEAL_METHODS.map((d) => (
            <Chip key={d} label={t(`deal.${d}`)} selected={dealMethods.includes(d)} onPress={() => toggleDeal(d)} />
          ))}
        </View>
        {errors.deal ? <Text className="text-xs text-danger dark:text-danger-dark">{errors.deal}</Text> : null}
      </View>

      <TextField label={t('form.city')} value={city} onChangeText={setCity} maxLength={60} />

      {/* Per-category fields */}
      {categorySlug && fieldsFor(categorySlug).length ? (
        <View className="gap-3">
          <Text className="text-base font-bold text-ink dark:text-ink-dark">{t('form.moreDetails')}</Text>
          {fieldsFor(categorySlug).map((f) =>
            f.kind === 'choice' ? (
              <View key={f.key} className="gap-2">
                <Text className="text-xs font-semibold text-muted dark:text-muted-dark">{f.label[language]}</Text>
                <View className="flex-row flex-wrap gap-2">
                  {(f.options ?? []).map((o) => (
                    <Chip key={o} label={o} selected={attrs[f.key] === o} onPress={() => setAttrs((a) => ({ ...a, [f.key]: a[f.key] === o ? '' : o }))} />
                  ))}
                </View>
              </View>
            ) : (
              <TextField
                key={f.key}
                label={f.unit ? `${f.label[language]} (${f.unit})` : f.label[language]}
                value={attrs[f.key] ?? ''}
                onChangeText={(v) => setAttrs((a) => ({ ...a, [f.key]: v }))}
                keyboardType={f.kind === 'number' ? 'numeric' : 'default'}
                maxLength={40}
              />
            ),
          )}
        </View>
      ) : null}
    </Screen>
  );
}

function IconButton({ name, label, onPress, disabled }: { name: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`h-11 w-9 items-center justify-center ${disabled ? 'opacity-30' : ''}`}>
      <Ionicons name={name} size={18} color={Colors.primary} />
    </Pressable>
  );
}

function ToggleRow({ label, help, value, onChange }: { label: string; help: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View className="min-h-12 flex-row items-center justify-between gap-4 rounded-card-sm bg-surface p-3 dark:bg-surface-dark">
      <View className="flex-1 gap-0.5">
        <Text className="text-base font-semibold text-ink dark:text-ink-dark">{label}</Text>
        <Text className="text-xs text-muted dark:text-muted-dark">{help}</Text>
      </View>
      <Switch accessibilityLabel={label} value={value} onValueChange={onChange} trackColor={{ true: Colors.primary }} />
    </View>
  );
}
