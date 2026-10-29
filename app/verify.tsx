import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Colors } from '@/constants/theme';
import { usePrefs } from '@/providers/prefs-provider';
import { isSupabaseConfigured, sendPhoneCode, verifyPhoneCode } from '@/services/auth';

const RESEND_SECONDS = 30;

export default function Verify() {
  const { t } = usePrefs();
  const { phone = '' } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  const verify = async (value: string) => {
    if (value.length !== 6 || busy) return;
    setBusy(true);
    setError(null);
    try {
      // On success the auth state changes and the route guard moves the user on.
      await verifyPhoneCode(phone, value);
    } catch {
      setError(t('auth.invalidCode'));
      setCode('');
      setBusy(false);
    }
  };

  const resend = async () => {
    setError(null);
    try {
      await sendPhoneCode(phone);
      setWait(RESEND_SECONDS);
    } catch {
      setError(t('auth.sendFailed'));
    }
  };

  return (
    <Screen title={t('auth.verifyTitle')}>
      <Text className="text-base text-muted dark:text-muted-dark">
        {t('auth.codeSent', { phone })}
      </Text>
      <View className="gap-1.5">
        <Text className="text-xs font-semibold text-muted dark:text-muted-dark">{t('auth.code')}</Text>
        <TextInput
          accessibilityLabel={t('auth.code')}
          value={code}
          onChangeText={(v) => {
            const digits = v.replace(/\D/g, '').slice(0, 6);
            setCode(digits);
            if (digits.length === 6) verify(digits);
          }}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          autoFocus
          maxLength={6}
          placeholder="••••••"
          placeholderTextColor={Colors.placeholder}
          style={{ textAlign: 'center', letterSpacing: 10, writingDirection: 'ltr' }}
          className="min-h-14 rounded-2xl border border-line bg-surface px-4 text-2xl font-bold text-ink dark:border-line-dark dark:bg-surface-dark dark:text-ink-dark"
        />
        {error ? <Text className="text-xs text-danger dark:text-danger-dark">{error}</Text> : null}
      </View>
      <Button label={t('auth.verify')} onPress={() => verify(code)} loading={busy} disabled={code.length !== 6} />
      <Button variant="ghost" label={wait > 0 ? t('auth.resendIn', { s: wait }) : t('auth.resend')} onPress={resend} disabled={wait > 0 || busy} />
      {!isSupabaseConfigured ? (
        <Text className="text-center text-xs text-muted dark:text-muted-dark">{t('auth.demoHint')}</Text>
      ) : null}
    </Screen>
  );
}
