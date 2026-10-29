import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { CountryChips } from '@/components/ui/country-chips';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/theme';
import { pickName } from '@/lib/names';
import { isValidNational, toE164 } from '@/lib/phone';
import { usePrefs } from '@/providers/prefs-provider';
import { isSupabaseConfigured, sendPhoneCode, signInWithProvider, type OAuthProvider } from '@/services/auth';

export default function SignIn() {
  const { t, country, setCountry, language, rtl } = usePrefs();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'phone' | OAuthProvider | null>(null);

  const submit = async () => {
    if (!isValidNational(phone, country)) {
      setError(t('auth.invalidPhone', { country: pickName(country.name, language) }));
      return;
    }
    setError(null);
    setBusy('phone');
    try {
      const e164 = toE164(phone, country);
      await sendPhoneCode(e164);
      router.push({ pathname: '/verify', params: { phone: e164 } });
    } catch {
      setError(t('auth.sendFailed'));
    } finally {
      setBusy(null);
    }
  };

  const oauth = async (provider: OAuthProvider) => {
    setError(null);
    setBusy(provider);
    try {
      await signInWithProvider(provider);
    } catch {
      setError(t('auth.oauthFailed'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen title={t('auth.title')}>
      <Text className="text-base text-muted dark:text-muted-dark">{t('auth.subtitle')}</Text>

      <View className="gap-2">
        <Text className="text-xs font-semibold text-muted dark:text-muted-dark">{t('auth.country')}</Text>
        <CountryChips value={country.code} onChange={setCountry} />
      </View>

      {/* Phone numbers stay left-to-right even in Arabic. */}
      <View className="flex-row items-end gap-2" style={{ direction: 'ltr' }}>
        <View className="min-h-12 justify-center rounded-2xl border border-line bg-surface px-4 dark:border-line-dark dark:bg-surface-dark">
          <Text className="text-base font-semibold text-ink dark:text-ink-dark">{country.dial}</Text>
        </View>
        <View className="flex-1">
          <TextField
            label={t('auth.phone')}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            autoComplete="tel"
            placeholder={t('auth.phonePlaceholder')}
            error={error}
            style={{ textAlign: 'left', writingDirection: 'ltr' }}
            onSubmitEditing={submit}
          />
        </View>
      </View>

      <Button label={t('auth.sendCode')} onPress={submit} loading={busy === 'phone'} disabled={busy !== null} />

      <View className="flex-row items-center gap-3">
        <View className="h-px flex-1 bg-line dark:bg-line-dark" />
        <Text className="text-xs text-muted dark:text-muted-dark">{t('common.or')}</Text>
        <View className="h-px flex-1 bg-line dark:bg-line-dark" />
      </View>

      <View className="gap-3">
        <Button variant="outline" label={t('auth.google')} onPress={() => oauth('google')} loading={busy === 'google'} disabled={busy !== null} />
        {/* Apple requires its own button on iOS when other social logins are offered; shown everywhere here for parity. */}
        {Platform.OS !== 'android' ? (
          <Button variant="outline" label={t('auth.apple')} onPress={() => oauth('apple')} loading={busy === 'apple'} disabled={busy !== null} />
        ) : null}
      </View>

      {!isSupabaseConfigured ? (
        <View className="flex-row items-start gap-2 rounded-2xl bg-brand-100 p-3 dark:bg-hero-dark">
          <Ionicons name="information-circle" size={18} color={Colors.primary} />
          <Text className="flex-1 text-xs text-ink dark:text-ink-dark">{t('auth.demoHint')}</Text>
        </View>
      ) : null}
      <Text className="text-center text-xs text-muted dark:text-muted-dark" style={{ writingDirection: rtl ? 'rtl' : 'ltr' }}>
        {t('auth.terms')}
      </Text>
    </Screen>
  );
}
