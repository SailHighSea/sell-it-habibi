import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { CountryChips } from '@/components/ui/country-chips';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { useAuth } from '@/providers/auth-provider';
import { usePrefs } from '@/providers/prefs-provider';
import { CATEGORIES } from '@/services/listings';
import { validateDisplayName } from '@/services/profile';

export default function Onboarding() {
  const { t, country, setCountry } = usePrefs();
  const { updateProfile } = useAuth();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const toggle = (slug: string) =>
    setInterests((cur) => (cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]));

  const finish = async () => {
    if (!validateDisplayName(name)) {
      setError(t('onboarding.nameInvalid'));
      return;
    }
    setError(null);
    setBusy(true);
    try {
      // Once `onboarded` is true the route guard opens the app.
      await updateProfile({ displayName: name.trim(), city: city.trim() || null, country: country.code, interests, onboarded: true });
    } catch {
      setError(t('onboarding.saveFailed'));
      setBusy(false);
    }
  };

  return (
    <Screen
      title={t('onboarding.title')}
      back={false}
      footer={<Button label={t('onboarding.finish')} onPress={finish} loading={busy} />}>
      <Text className="text-base text-muted dark:text-muted-dark">{t('onboarding.subtitle')}</Text>
      <TextField
        label={t('onboarding.name')}
        value={name}
        onChangeText={setName}
        placeholder={t('onboarding.namePlaceholder')}
        help={t('onboarding.nameHelp')}
        error={error}
        maxLength={30}
        autoComplete="name"
      />
      <View className="gap-2">
        <Text className="text-xs font-semibold text-muted dark:text-muted-dark">{t('auth.country')}</Text>
        <CountryChips value={country.code} onChange={setCountry} />
      </View>
      <TextField label={t('onboarding.city')} value={city} onChangeText={setCity} placeholder={t('onboarding.cityPlaceholder')} maxLength={60} />
      <View className="gap-2">
        <Text className="text-base font-bold text-ink dark:text-ink-dark">{t('onboarding.interests')}</Text>
        <Text className="text-xs text-muted dark:text-muted-dark">{t('onboarding.interestsHelp')}</Text>
        <View className="flex-row flex-wrap gap-2">
          {CATEGORIES.map((slug) => (
            <Chip key={slug} label={t(`cat.${slug}`)} selected={interests.includes(slug)} onPress={() => toggle(slug)} />
          ))}
        </View>
      </View>
    </Screen>
  );
}
