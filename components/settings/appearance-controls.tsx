import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';

import { Chip } from '@/components/ui/chip';
import { LOOKS } from '@/constants/looks';
import { PALETTE_IDS, palettePreview } from '@/constants/palettes';
import { Colors } from '@/constants/theme';
import { chooseBackgroundPicture } from '@/lib/background-picture';
import { APPEARANCES, BACKGROUNDS, EFFECTS, usePrefs } from '@/providers/prefs-provider';

const BLUR_STEPS = [0, 6, 12, 18, 24];

/** Light or dark, look, background, effects and colours. Shared by Settings and the first-run welcome. */
export function AppearanceControls() {
  const { t, lookChoice, setLook, effects, setEffects, lowEnd, palette, setPalette, appearance, setAppearance, background, setBackground, picture, setPicture, blur, setBlur } = usePrefs();
  return (
    <>
      <View className="gap-2">
        <Text className="text-base font-bold text-ink dark:text-ink-dark">{t('settings.appearance')}</Text>
        <View className="flex-row rounded-full border border-line bg-surface p-1 dark:border-line-dark dark:bg-surface-dark" accessibilityRole="tablist">
          {APPEARANCES.map((a) => (
            <Pressable
              key={a}
              accessibilityRole="tab"
              accessibilityState={{ selected: a === appearance }}
              onPress={() => setAppearance(a)}
              className={`min-h-11 flex-1 items-center justify-center rounded-full px-1 ${a === appearance ? 'bg-canvas dark:bg-canvas-dark' : ''}`}>
              <Text numberOfLines={1} adjustsFontSizeToFit className={`text-sm ${a === appearance ? 'font-bold text-ink dark:text-ink-dark' : 'font-medium text-muted dark:text-muted-dark'}`}>
                {t(`settings.appearance.${a}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-base font-bold text-ink dark:text-ink-dark">{t('settings.palette')}</Text>
        <View className="flex-row flex-wrap gap-3">
          {PALETTE_IDS.map((id) => {
            const p = palettePreview(id);
            const selected = id === palette;
            return (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={t(`settings.palette.${id}`)}
                onPress={() => setPalette(id)}
                className={`w-[48%] gap-3 rounded-3xl border-2 bg-surface p-3 dark:bg-surface-dark ${selected ? 'border-brand-600 dark:border-brand-400' : 'border-transparent'}`}>
                <View className="h-[68px] justify-end gap-1.5 rounded-2xl px-4 pb-3" style={{ backgroundColor: p.hero }}>
                  <View className="h-2 w-[52%] rounded-full" style={{ backgroundColor: p.accent }} />
                  <View className="h-2 w-[76%] rounded-full" style={{ backgroundColor: p.track }} />
                </View>
                <View className="flex-row items-center justify-between px-1">
                  <Text numberOfLines={1} className="text-base font-bold text-ink dark:text-ink-dark">{t(`settings.palette.${id}`)}</Text>
                  {selected ? (
                    <View className="flex-row items-center gap-1">
                      <Text className="text-xs font-semibold text-brand-600 dark:text-brand-400">{t('settings.selected')}</Text>
                      <Ionicons name="checkmark" size={14} color={Colors.primary} />
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-base font-bold text-ink dark:text-ink-dark">{t('settings.look')}</Text>
        {LOOKS.map((l) => {
          const selected = l === lookChoice;
          const glass = l === 'frosted';
          return (
            <Pressable
              key={l}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setLook(l)}
              className={`flex-row items-center gap-3 rounded-2xl border-2 bg-surface p-3 dark:bg-surface-dark ${selected ? 'border-brand-600 dark:border-brand-400' : 'border-transparent'}`}>
              <LinearGradient
                colors={glass ? ['#7AA7FF', '#FF9BD2', '#FFD27A'] : ['#FFFFFF', '#DCEFE6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: 44, height: 44, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' }}
              />
              <View className="flex-1 gap-0.5">
                <Text className="text-base font-bold text-ink dark:text-ink-dark">{t(glass ? 'settings.lookFrosted' : 'settings.lookClassic')}</Text>
                <Text className="text-xs text-muted dark:text-muted-dark">{t(glass ? 'settings.lookFrostedHelp' : 'settings.lookClassicHelp')}</Text>
              </View>
              {selected ? <Ionicons name="checkmark-circle" size={24} color={Colors.primary} /> : null}
            </Pressable>
          );
        })}
      </View>

      <View className="gap-2">
        <Text className="text-base font-bold text-ink dark:text-ink-dark">{t('settings.background')}</Text>
        <View className="flex-row flex-wrap gap-2">
          {BACKGROUNDS.map((b) => (
            <Chip
              key={b}
              label={t(`settings.background.${b}`)}
              selected={b === background}
              onPress={async () => {
                if (b !== 'picture') return setBackground(b);
                if (picture) return setBackground('picture');
                const uri = await chooseBackgroundPicture();
                if (uri) {
                  setPicture(uri);
                  setBackground('picture');
                }
              }}
            />
          ))}
        </View>
        {background === 'picture' ? (
          <View className="gap-2 rounded-2xl border border-line bg-surface p-3 dark:border-line-dark dark:bg-surface-dark">
            <Chip
              label={t('settings.changePicture')}
              onPress={async () => {
                const uri = await chooseBackgroundPicture();
                if (uri) setPicture(uri);
              }}
            />
            <Text className="text-xs font-semibold text-muted dark:text-muted-dark">{t('settings.blur')}</Text>
            <View className="flex-row flex-wrap gap-2">
              {BLUR_STEPS.map((n) => (
                <Chip key={n} label={String(n)} selected={n === blur} onPress={() => setBlur(n)} />
              ))}
            </View>
            <Text className="text-xs text-muted dark:text-muted-dark">{t('settings.pictureHelp')}</Text>
          </View>
        ) : null}
      </View>

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
