import Constants from 'expo-constants';
import { Pressable, Switch, Text, View } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { CountryChips } from '@/components/ui/country-chips';
import { Screen } from '@/components/ui/screen';
import { Colors } from '@/constants/theme';
import { LOOKS } from '@/constants/looks';
import { PALETTE_IDS, PALETTES } from '@/constants/palettes';
import { LANGUAGES } from '@/i18n';
import { APPEARANCES, EFFECTS, usePrefs } from '@/providers/prefs-provider';

export default function Settings() {
  const { t, language, setLanguage, country, setCountry, notifications, setNotifications, needsRestart, lookChoice, setLook, effects, setEffects, lowEnd, palette, setPalette, appearance, setAppearance, currency } = usePrefs();
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
        <Text className="text-base font-bold text-ink dark:text-ink-dark">{t('settings.look')}</Text>
        <View className="flex-row flex-wrap gap-2">
          {LOOKS.map((l) => (
            <Chip key={l} label={t(l === 'frosted' ? 'settings.lookFrosted' : 'settings.lookClassic')} selected={l === lookChoice} onPress={() => setLook(l)} />
          ))}
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-base font-bold text-ink dark:text-ink-dark">{t('settings.effects')}</Text>
        <View className="flex-row flex-wrap gap-2">
          {EFFECTS.map((e) => (
            <Chip key={e} label={t(`settings.effects.${e}`)} selected={e === effects} onPress={() => setEffects(e)} />
          ))}
        </View>
        <Text className="text-xs text-muted dark:text-muted-dark">{t('settings.effectsHelp')}{effects === 'auto' && lowEnd ? ` ${t('settings.effectsLowEnd')}` : ''}</Text>
      </View>

      <View className="gap-2">
        <Text className="text-base font-bold text-ink dark:text-ink-dark">{t('settings.appearance')}</Text>
        <View className="flex-row flex-wrap gap-2">
          {APPEARANCES.map((a) => (
            <Chip key={a} label={t(`settings.appearance.${a}`)} selected={a === appearance} onPress={() => setAppearance(a)} />
          ))}
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-base font-bold text-ink dark:text-ink-dark">{t('settings.palette')}</Text>
        <View className="flex-row flex-wrap gap-2">
          {PALETTE_IDS.map((id) => (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityState={{ selected: id === palette }}
              onPress={() => setPalette(id)}
              className={`min-h-11 flex-row items-center gap-2 rounded-full border px-4 ${id === palette ? 'border-transparent bg-brand-50 dark:bg-hero-dark' : 'border-line bg-surface dark:border-line-dark dark:bg-surface-dark'}`}>
              <View className="h-5 w-5 rounded-full" style={{ backgroundColor: PALETTES[id].swatch }} />
              <Text className={`text-sm ${id === palette ? 'font-bold text-brand-700 dark:text-brand-400' : 'font-medium text-ink dark:text-ink-dark'}`}>{t(`settings.palette.${id}`)}</Text>
            </Pressable>
          ))}
        </View>
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
