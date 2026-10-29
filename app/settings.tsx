import Constants from 'expo-constants';
import { Switch, Text, View } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { CountryChips } from '@/components/ui/country-chips';
import { Screen } from '@/components/ui/screen';
import { Colors } from '@/constants/theme';
import { LANGUAGES } from '@/i18n';
import { usePrefs } from '@/providers/prefs-provider';

export default function Settings() {
  const { t, language, setLanguage, country, setCountry, notifications, setNotifications, needsRestart, currency } = usePrefs();
  return (
    <Screen title={t('settings.title')}>
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
        <Text className="text-xs text-muted dark:text-muted-dark">{currency}</Text>
      </View>

      <View className="flex-row items-center justify-between gap-4 rounded-card-sm bg-surface p-4 dark:bg-surface-dark">
        <View className="flex-1 gap-0.5">
          <Text className="text-base font-bold text-ink dark:text-ink-dark">{t('settings.notifications')}</Text>
          <Text className="text-xs text-muted dark:text-muted-dark">{t('settings.notificationsHelp')}</Text>
        </View>
        <Switch
          accessibilityLabel={t('settings.notifications')}
          value={notifications}
          onValueChange={setNotifications}
          trackColor={{ true: Colors.primary }}
        />
      </View>

      <Text className="text-center text-xs text-muted dark:text-muted-dark">
        {t('settings.version')} {Constants.expoConfig?.version ?? '1.0.0'}
      </Text>
    </Screen>
  );
}
