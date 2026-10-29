import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppearanceControls } from '@/components/settings/appearance-controls';
import { BackdropLayer } from '@/components/ui/backdrop-layer';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { CountryChips } from '@/components/ui/country-chips';
import { Frost } from '@/components/ui/frost';
import { Logo } from '@/components/ui/logo';
import { citiesIn } from '@/constants/cities';
import { APP_NAME, Colors } from '@/constants/theme';
import { LANGUAGES } from '@/i18n';
import { pickName } from '@/lib/names';
import { distanceKm, nearestCity } from '@/lib/geo';
import { useLocation } from '@/providers/location-provider';
import { usePrefs } from '@/providers/prefs-provider';

// Changing the colours rebuilds the screens below the root (so icons repaint); keep the step across that.
let rememberedStep: 1 | 2 = 1;

/** First launch: where you are, then how the app should look. Everything can be changed later in Settings. */
export default function Welcome() {
  const { t, language, setLanguage, country, setCountry, needsRestart, completeSetup } = usePrefs();
  const { city, usingGps, setCity, locateMe } = useLocation();
  const [step, setStepState] = useState<1 | 2>(rememberedStep);
  const setStep = (n: 1 | 2) => {
    rememberedStep = n;
    setStepState(n);
  };
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const cityName = (c: { en: string; ar: string; si?: string }) => pickName(c, language);

  const detect = async () => {
    setBusy(true);
    setNote(null);
    const { status, coords } = await locateMe();
    setBusy(false);
    if (status === 'denied') return setNote(t('loc.denied'));
    if (status === 'unavailable' || !coords) return setNote(t('loc.unavailable'));
    const found = nearestCity(coords);
    if (distanceKm(coords, found) > 400) {
      setCity(city.id); // back to the chosen city: the phone is outside the countries we serve
      return setNote(t('welcome.outside'));
    }
    if (found.country !== country.code) setCountry(found.country);
    setNote(t('welcome.detected', { city: cityName(found) }));
  };

  return (
    <SafeAreaView className="flex-1">
      <BackdropLayer />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="mx-auto w-full max-w-lg gap-6 px-5 pb-6 pt-6">
        <View className="items-center gap-3">
          <Logo size={72} />
          <Text accessibilityRole="header" className="text-center text-2xl font-extrabold text-ink dark:text-ink-dark">
            {t('welcome.title', { app: APP_NAME })}
          </Text>
          <Text className="text-center text-xs text-muted dark:text-muted-dark">{t('welcome.step', { n: step, total: 2 })}</Text>
        </View>

        {step === 1 ? (
          <>
            <View className="gap-1">
              <Text className="text-xl font-bold text-ink dark:text-ink-dark">{t('welcome.where')}</Text>
              <Text className="text-sm text-muted dark:text-muted-dark">{t('welcome.whereBody')}</Text>
            </View>

            <View className="gap-2">
              <Text className="text-base font-bold text-ink dark:text-ink-dark">{t('settings.language')}</Text>
              <View className="flex-row flex-wrap gap-2">
                {LANGUAGES.map((l) => (
                  <Chip key={l.code} label={l.label} selected={l.code === language} onPress={() => setLanguage(l.code)} />
                ))}
              </View>
              {needsRestart ? <Text className="text-xs text-muted dark:text-muted-dark">{t('settings.restart')}</Text> : null}
            </View>

            <View className="gap-2">
              <Text className="text-base font-bold text-ink dark:text-ink-dark">{t('settings.country')}</Text>
              <CountryChips value={country.code} onChange={setCountry} />
            </View>

            <View className="gap-2">
              <Text className="text-base font-bold text-ink dark:text-ink-dark">{t('loc.city')}</Text>
              <View className="rounded-card border border-line bg-surface p-4 dark:border-line-dark dark:bg-surface-dark gap-2">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="navigate" size={18} color={Colors.primary} />
                  <Text className="flex-1 text-sm font-semibold text-ink dark:text-ink-dark">{t('welcome.detect')}</Text>
                </View>
                <Text className="text-xs text-muted dark:text-muted-dark">{t('welcome.detectHelp')}</Text>
                <Button label={usingGps ? t('loc.usingGps') : t('welcome.detectButton')} variant={usingGps ? 'outline' : 'primary'} loading={busy} onPress={detect} />
                {note ? <Text className="text-xs font-semibold text-brand-700 dark:text-brand-400">{note}</Text> : null}
              </View>
              <Text className="text-xs text-muted dark:text-muted-dark">{t('welcome.orPick')}</Text>
              <View className="flex-row flex-wrap gap-2">
                {citiesIn(country.code).map((c) => (
                  <Chip key={c.id} label={cityName(c)} selected={!usingGps && c.id === city.id} onPress={() => setCity(c.id)} />
                ))}
              </View>
            </View>
          </>
        ) : (
          <>
            <View className="gap-1">
              <Text className="text-xl font-bold text-ink dark:text-ink-dark">{t('welcome.look')}</Text>
              <Text className="text-sm text-muted dark:text-muted-dark">{t('welcome.lookBody')}</Text>
            </View>
            <AppearanceControls />
          </>
        )}
      </ScrollView>

      <View className="mx-auto w-full max-w-lg px-3 pb-3">
        <Frost className="flex-row gap-3 rounded-3xl p-3">
          {step === 2 ? <Button className="flex-1" variant="outline" label={t('common.back')} onPress={() => setStep(1)} /> : null}
          <Button
            className="flex-1"
            label={step === 1 ? t('common.continue') : t('welcome.start')}
            onPress={() => (step === 1 ? setStep(2) : completeSetup())}
          />
        </Frost>
      </View>
    </SafeAreaView>
  );
}
