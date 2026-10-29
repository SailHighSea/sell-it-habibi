import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { usePrefs } from '@/providers/prefs-provider';

export function ScreenHeader({ title, back = true }: { title: string; back?: boolean }) {
  const { rtl, t } = usePrefs();
  return (
    <View className="mx-auto w-full max-w-lg flex-row items-center gap-1 px-2 pt-2">
      {back ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          className="h-11 w-11 items-center justify-center">
          <Ionicons name={rtl ? 'arrow-forward' : 'arrow-back'} size={22} color={Colors.primary} />
        </Pressable>
      ) : (
        <View className="w-3" />
      )}
      <Text accessibilityRole="header" className="flex-1 text-2xl font-bold text-ink dark:text-ink-dark">
        {title}
      </Text>
    </View>
  );
}

type Props = { title: string; children: ReactNode; back?: boolean; footer?: ReactNode };

/** Standard page for forms and settings: header with back arrow, centered column on wide web, optional pinned footer. */
export function Screen({ title, children, back = true, footer }: Props) {
  return (
    <SafeAreaView className="flex-1 bg-canvas dark:bg-canvas-dark">
      <ScreenHeader title={title} back={back} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="mx-auto w-full max-w-lg gap-5 px-5 pb-8 pt-4">
        {children}
      </ScrollView>
      {footer ? <View className="mx-auto w-full max-w-lg px-5 pb-4">{footer}</View> : null}
    </SafeAreaView>
  );
}

/** Header plus a full-width list below it (grids use the whole window, not the form column). */
export function ListScreen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <SafeAreaView className="flex-1 bg-canvas dark:bg-canvas-dark">
      <ScreenHeader title={title} />
      <View className="flex-1 pt-3">{children}</View>
    </SafeAreaView>
  );
}
