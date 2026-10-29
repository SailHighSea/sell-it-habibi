import { Pressable, Text, View } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { LOOKS } from '@/constants/looks';
import { PALETTE_IDS, PALETTES } from '@/constants/palettes';
import { APPEARANCES, BACKGROUNDS, EFFECTS, usePrefs } from '@/providers/prefs-provider';

/** Light or dark, look, background, effects and colours. Shared by Settings and the first-run welcome. */
export function AppearanceControls() {
  const { t, lookChoice, setLook, effects, setEffects, lowEnd, palette, setPalette, appearance, setAppearance, background, setBackground } = usePrefs();
  return (
    <>
      <Group label={t('settings.appearance')}>
        {APPEARANCES.map((a) => (
          <Chip key={a} label={t(`settings.appearance.${a}`)} selected={a === appearance} onPress={() => setAppearance(a)} />
        ))}
      </Group>

      <Group label={t('settings.palette')}>
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
      </Group>

      <Group label={t('settings.look')}>
        {LOOKS.map((l) => (
          <Chip key={l} label={t(l === 'frosted' ? 'settings.lookFrosted' : 'settings.lookClassic')} selected={l === lookChoice} onPress={() => setLook(l)} />
        ))}
      </Group>

      <Group label={t('settings.background')}>
        {BACKGROUNDS.map((b) => (
          <Chip key={b} label={t(`settings.background.${b}`)} selected={b === background} onPress={() => setBackground(b)} />
        ))}
      </Group>

      <Group
        label={t('settings.effects')}
        help={`${t('settings.effectsHelp')}${effects === 'auto' && lowEnd ? ` ${t('settings.effectsLowEnd')}` : ''}`}>
        {EFFECTS.map((e) => (
          <Chip key={e} label={t(`settings.effects.${e}`)} selected={e === effects} onPress={() => setEffects(e)} />
        ))}
      </Group>
    </>
  );
}

function Group({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="text-base font-bold text-ink dark:text-ink-dark">{label}</Text>
      <View className="flex-row flex-wrap gap-2">{children}</View>
      {help ? <Text className="text-xs text-muted dark:text-muted-dark">{help}</Text> : null}
    </View>
  );
}
