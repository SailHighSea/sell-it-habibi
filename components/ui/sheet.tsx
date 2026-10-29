import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePrefs } from '@/providers/prefs-provider';

type Props = { visible: boolean; title: string; onClose: () => void; children: ReactNode };

/** Bottom sheet. Tapping outside, or the hardware back button, closes it. */
export function Sheet({ visible, title, onClose, children }: Props) {
  const insets = useSafeAreaInsets();
  const { t } = usePrefs();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable accessibilityLabel={t('common.cancel')} onPress={onClose} className="flex-1 bg-black/50" />
      <View className="max-h-[85%] w-full self-center rounded-t-3xl bg-canvas px-5 pt-5 dark:bg-canvas-dark" style={{ paddingBottom: insets.bottom + 16, maxWidth: 560 }}>
        <Text accessibilityRole="header" className="mb-3 text-xl font-bold text-ink dark:text-ink-dark">
          {title}
        </Text>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-4 pb-2">
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}
